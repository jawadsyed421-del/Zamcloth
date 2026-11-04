const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const multer = require('multer');
const Order = require('../models/Order.cjs');
const Product = require('../models/Product.cjs');
const Transaction = require('../models/Transaction.cjs');
const User = require('../models/User.cjs');
const { requireUser, requireAdmin, requireAny } = require('../middleware/auth.cjs');
const { createWorkbook, readSpreadsheetRows } = require('../utils/spreadsheets.cjs');

const router = express.Router();
const spreadsheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

const PREPAID_DISCOUNT_PERCENT = 5;
const COD_ADVANCE = 99;
const FREE_SHIPPING_MIN = 1499;
const STANDARD_SHIPPING_FEE = 1499;
const STATUSES = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'];
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);

// Customer: place an order. Prices and stock come from the database, never from the browser.
router.post('/', requireUser, async (req, res) => {
    try {
        const { items, shippingAddress: a = {}, paymentMethod } = req.body || {};
        const partialCod = paymentMethod === 'Partial COD';
        if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
            return res.status(400).json({ message: 'Your bag is empty' });
        }
        const address = {
            fullName: str(a.fullName, 100), email: str(a.email, 120), phone: str(a.phone, 20),
            address: str(a.address, 200), city: str(a.city, 80), postalCode: str(a.postalCode, 12), country: 'India',
        };
        if (Object.values(address).some(v => !v)) return res.status(400).json({ message: 'Fill in every shipping detail' });

        const orderItems = [];
        let itemsPrice = 0;
        for (const item of items) {
            const qty = parseInt(item.quantity, 10);
            if (!mongoose.isValidObjectId(item.productId) || !(qty >= 1 && qty <= 20)) {
                return res.status(400).json({ message: 'Invalid item in your bag' });
            }
            const product = await Product.findById(item.productId);
            if (!product) return res.status(400).json({ message: 'An item in your bag is no longer available' });
            if (product.stock < qty) {
                return res.status(409).json({ message: `Only ${product.stock} left of ${product.name}` });
            }
            // If the product has colour options the shopper must have picked one of them
            const options = (product.colorOptions || []).map(c => c.name);
            const color = str(item.color, 40);
            if (options.length && !options.includes(color)) {
                return res.status(400).json({ message: `Choose a colour for ${product.name}` });
            }
            const photoIdx = options.length ? (product.imageColors || []).indexOf(color) : -1;
            const itemImage = photoIdx >= 0 && product.images?.[photoIdx] ? product.images[photoIdx] : product.image;
            orderItems.push({
                product: product._id, productCode: product.productCode || '', name: product.name, image: itemImage,
                price: product.price, quantity: qty, size: str(item.size, 20), color,
            });
            itemsPrice += product.price * qty;
        }

        // Extra 5% off for prepaid (online) orders only
        const discountPrice = partialCod ? 0 : Math.round(itemsPrice * PREPAID_DISCOUNT_PERCENT) / 100;
        const shippingPrice = itemsPrice - discountPrice >= FREE_SHIPPING_MIN ? 0 : STANDARD_SHIPPING_FEE;
        const totalPrice = itemsPrice - discountPrice + shippingPrice;
        if (partialCod && totalPrice <= COD_ADVANCE) {
            return res.status(400).json({ message: `Partial COD is available on orders above ₹${COD_ADVANCE}` });
        }

        const order = await Order.create({
            user: req.auth.sub, orderItems, shippingAddress: address,
            paymentMethod: partialCod ? 'Partial COD' : 'Online',
            itemsPrice, discountPrice, taxPrice: 0, shippingPrice, totalPrice,
            advanceAmount: partialCod ? COD_ADVANCE : 0,
            codBalance: partialCod ? totalPrice - COD_ADVANCE : 0,
        });
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: import legacy or offline orders from an Excel/CSV file. One row per product;
// rows sharing orderNumber are combined. Historical imports do not modify current stock.
router.post('/bulk-upload', requireAdmin, spreadsheetUpload.single('file'), async (req, res) => {
    const createdOrders = [];
    const createdTransactions = [];
    try {
        if (!req.file) return res.status(400).json({ message: 'Choose an Excel or CSV file to upload' });
        const rows = await readSpreadsheetRows(req.file);
        if (!rows.length || rows.length > 5000) return res.status(400).json({ message: 'The file must contain between 1 and 5,000 order-item rows' });

        const errors = [];
        const grouped = new Map();
        const codes = new Set();
        rows.forEach((row, index) => {
            const line = index + 2;
            const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]));
            const value = (key) => String(normalized[key.toLowerCase()] ?? '').trim();
            const number = value('orderNumber');
            const productCode = value('productCode').toUpperCase();
            const quantity = Number(value('quantity'));
            const price = Number(value('unitPrice'));
            const paymentMethod = value('paymentMethod') || 'Offline';
            if (!number || number.length > 100 || !productCode || !value('email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')) || !value('fullName') || !value('phone') ||
                !value('address') || !value('city') || !value('postalCode')) {
                errors.push(`Row ${line}: orderNumber, productCode, email, fullName, phone, address, city, and postalCode are required`);
                return;
            }
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) errors.push(`Row ${line}: quantity must be a whole number from 1 to 10,000`);
            if (!Number.isFinite(price) || price < 0) errors.push(`Row ${line}: unitPrice must be a non-negative number`);
            if (!['Online', 'Partial COD', 'Offline'].includes(paymentMethod)) errors.push(`Row ${line}: paymentMethod must be Online, Partial COD, or Offline`);
            const paymentAmount = value('paymentAmount') === '' ? 0 : Number(value('paymentAmount'));
            if (!Number.isFinite(paymentAmount) || paymentAmount < 0) errors.push(`Row ${line}: paymentAmount must be a non-negative number`);
            const group = grouped.get(number) || { number, rows: [], first: normalized };
            group.rows.push({ row: normalized, line, productCode, quantity, price, paymentAmount, paymentMethod });
            grouped.set(number, group);
            codes.add(productCode);
        });
        if (grouped.size > 1000) errors.push('A single upload can contain at most 1,000 orders');
        if (errors.length) return res.status(400).json({ message: errors.slice(0, 30).join('\n'), errors });

        const importedNumbers = [...grouped.keys()];
        const duplicate = await Order.find({ externalOrderNumber: { $in: importedNumbers } }).select('externalOrderNumber').lean();
        if (duplicate.length) return res.status(409).json({ message: `Order numbers already imported: ${duplicate.map(o => o.externalOrderNumber).join(', ')}` });
        const importRefs = importedNumbers.map(number => `IMP_${crypto.createHash('sha256').update(number).digest('hex').slice(0, 32)}`);
        const duplicatePayments = await Transaction.find({ gatewayOrderId: { $in: importRefs } }).select('gatewayOrderId').lean();
        if (duplicatePayments.length) return res.status(409).json({ message: 'A payment reference from this import already exists. Check the order numbers.' });
        const [products, users] = await Promise.all([
            Product.find({ productCode: { $in: [...codes] } }).lean(),
            User.find({ email: { $in: [...new Set([...grouped.values()].map(g => String(g.first.email).trim().toLowerCase()))] } }).select('email').lean(),
        ]);
        const productByCode = new Map(products.map(p => [p.productCode, p]));
        const userByEmail = new Map(users.map(u => [u.email, u._id]));
        for (const group of grouped.values()) {
            group.rows.forEach(item => {
                if (!productByCode.has(item.productCode)) errors.push(`Row ${item.line}: unknown productCode "${item.productCode}"`);
            });
            const first = group.rows[0];
            const sameMethod = group.rows.every(item => item.paymentMethod === first.paymentMethod);
            const samePayment = group.rows.every(item => item.paymentAmount === first.paymentAmount);
            if (!sameMethod || !samePayment) errors.push(`Order ${group.number}: paymentMethod and paymentAmount must match on every item row`);
            const sharedFields = ['email', 'fullName', 'phone', 'address', 'city', 'postalCode', 'country', 'shippingPrice', 'discountPrice', 'taxPrice', 'totalPrice', 'status', 'placedAt', 'paidAt'];
            sharedFields.forEach(field => {
                const values = new Set(group.rows.map(item => String(item.row[field] ?? '').trim()).filter(Boolean));
                if (values.size > 1) errors.push(`Order ${group.number}: ${field} must match on every item row`);
            });
        }
        if (errors.length) return res.status(400).json({ message: errors.slice(0, 30).join('\n'), errors });

        const orderIds = [];
        for (const group of grouped.values()) {
            const first = group.rows[0];
            const itemRows = group.rows;
            const orderItems = itemRows.map(item => {
                const product = productByCode.get(item.productCode);
                return {
                    product: product._id, productCode: product.productCode, name: product.name, image: product.image,
                    price: item.price, quantity: item.quantity, size: str(item.row.size, 20), color: str(item.row.color, 40),
                };
            });
            const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const field = (name) => String(group.first[name] ?? '').trim();
            const discountPrice = field('discountPrice') === '' ? 0 : Number(field('discountPrice'));
            const shippingPrice = field('shippingPrice') === '' ? 0 : Number(field('shippingPrice'));
            const taxPrice = field('taxPrice') === '' ? 0 : Number(field('taxPrice'));
            const totalPrice = field('totalPrice') === '' ? itemsPrice - discountPrice + shippingPrice + taxPrice : Number(field('totalPrice'));
            const paymentAmount = first.paymentAmount;
            if ([discountPrice, shippingPrice, taxPrice, totalPrice].some(n => !Number.isFinite(n) || n < 0) || paymentAmount > totalPrice) {
                errors.push(`Order ${group.number}: invalid discount, shipping, tax, total, or payment amount`);
                continue;
            }
            if (first.paymentMethod !== 'Partial COD' && paymentAmount > 0 && paymentAmount < totalPrice) {
                errors.push(`Order ${group.number}: partial payments must use paymentMethod Partial COD`);
                continue;
            }
            const importedDate = field('placedAt') ? new Date(field('placedAt')) : new Date();
            if (Number.isNaN(importedDate.getTime())) {
                errors.push(`Order ${group.number}: placedAt must be a valid date`);
                continue;
            }
            const method = first.paymentMethod;
            const paidAt = paymentAmount > 0 ? (field('paidAt') ? new Date(field('paidAt')) : importedDate) : undefined;
            if (paidAt && Number.isNaN(paidAt.getTime())) {
                errors.push(`Order ${group.number}: paidAt must be a valid date`);
                continue;
            }
            const status = field('status') || (paymentAmount > 0 ? 'processing' : 'pending_payment');
            if (!STATUSES.includes(status)) {
                errors.push(`Order ${group.number}: invalid status "${status}"`);
                continue;
            }
            const order = await Order.create({
                user: userByEmail.get(field('email').toLowerCase()),
                externalOrderNumber: group.number.slice(0, 100),
                orderItems,
                shippingAddress: {
                    fullName: str(field('fullName'), 100), email: str(field('email'), 120).toLowerCase(),
                    phone: str(field('phone'), 20), address: str(field('address'), 200),
                    city: str(field('city'), 80), postalCode: str(field('postalCode'), 12),
                    country: str(field('country') || 'India', 60),
                },
                paymentMethod: method, discountPrice, shippingPrice, taxPrice, itemsPrice, totalPrice,
                advanceAmount: method === 'Partial COD' ? paymentAmount : 0,
                codBalance: method === 'Partial COD' ? Math.max(0, totalPrice - paymentAmount) : 0,
                codCollectedAmount: 0, isPaid: paymentAmount > 0, paidAt, status, createdAt: importedDate,
            });
            createdOrders.push(order._id);
            orderIds.push({ order, method, paymentAmount, paidAt });
        }
        if (errors.length) {
            await Order.deleteMany({ _id: { $in: createdOrders } });
            return res.status(400).json({ message: errors.slice(0, 30).join('\n'), errors });
        }

        const payments = orderIds.filter(item => item.paymentAmount > 0).map(({ order, method, paymentAmount, paidAt }) => {
            const paymentRef = `IMP_${crypto.createHash('sha256').update(order.externalOrderNumber).digest('hex').slice(0, 32)}`;
            return {
                order: order._id, user: order.user, gateway: method === 'Offline' ? 'Offline import' : 'Historical import',
                gatewayOrderId: paymentRef, gatewayPaymentId: order.externalOrderNumber,
                method: method === 'Offline' ? 'Offline' : method === 'Partial COD' ? 'Online advance' : 'Online',
                customerName: order.shippingAddress.fullName, customerEmail: order.shippingAddress.email,
                customerPhone: order.shippingAddress.phone, amount: paymentAmount, currency: 'INR',
                status: 'paid', paidAt,
            };
        });
        if (payments.length) {
            const inserted = await Transaction.insertMany(payments, { ordered: true });
            createdTransactions.push(...inserted.map(payment => payment._id));
        }
        res.status(201).json({ imported: createdOrders.length, payments: createdTransactions.length });
    } catch (error) {
        await Promise.all([
            createdOrders.length ? Order.deleteMany({ _id: { $in: createdOrders } }) : Promise.resolve(),
            createdOrders.length ? Transaction.deleteMany({ order: { $in: createdOrders } }) : Promise.resolve(),
            createdTransactions.length ? Transaction.deleteMany({ _id: { $in: createdTransactions } }) : Promise.resolve(),
        ]);
        if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Excel or CSV files must be under 10 MB' });
        if (error.code === 11000) return res.status(409).json({ message: 'An order number or payment reference already exists. Check the file for duplicates.' });
        if (error.message === 'Upload an .xlsx or .csv file') return res.status(400).json({ message: error.message });
        console.error('Order bulk import failed:', error.message);
        res.status(400).json({ message: 'Could not import orders. Check that the file is a valid Excel or CSV sheet.' });
    }
});

router.get('/bulk-template', requireAdmin, async (req, res) => {
    const headers = ['orderNumber', 'email', 'fullName', 'phone', 'address', 'city', 'postalCode', 'country', 'paymentMethod', 'paymentAmount', 'shippingPrice', 'discountPrice', 'taxPrice', 'totalPrice', 'status', 'placedAt', 'paidAt', 'productCode', 'quantity', 'unitPrice', 'size', 'color'];
    const buffer = await createWorkbook([{ name: 'Orders', columns: headers }]);
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="zamcloth-order-template.xlsx"',
    }).send(buffer);
});

// Customer: my orders
router.get('/mine', requireUser, async (req, res) => {
    res.json(await Order.find({ user: req.auth.sub }).sort({ createdAt: -1 }));
});

// Admin: all orders with customer and payment info
router.get('/', requireAdmin, async (req, res) => {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(500).populate('user', 'name email phone').lean();
    const transactions = await Transaction.find({ order: { $in: orders.map(o => o._id) } }).lean();
    const byOrder = new Map(transactions.map(t => [String(t.order), t]));
    res.json(orders.map(o => ({ ...o, transaction: byOrder.get(String(o._id)) || null })));
});

// Owner or admin: single order
router.get('/:id', requireAny, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Order not found' });
    const order = await Order.findById(req.params.id);
    if (!order || (req.auth.role === 'user' && String(order.user) !== req.auth.sub)) {
        return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
});

// Admin: update fulfilment status
router.put('/:id/status', requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Order not found' });
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!order.isPaid && status !== 'pending_payment' && status !== 'cancelled') {
        return res.status(409).json({ message: 'This order has not been paid yet' });
    }
    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();
    res.json(order);
});

router.put('/:id/cod-collected', requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Order not found' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'Partial COD' || !order.isPaid) {
        return res.status(409).json({ message: 'Only orders with a paid Partial COD advance have a COD balance to collect' });
    }
    if (req.body?.collected === true) {
        order.codCollectedAmount = order.codBalance;
        order.codCollectedAt = new Date();
    } else {
        order.codCollectedAmount = 0;
        order.codCollectedAt = undefined;
    }
    await order.save();
    res.json(order);
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
            message: err.code === 'LIMIT_FILE_SIZE' ? 'Excel or CSV files must be under 10 MB' : 'Upload one Excel or CSV file',
        });
    }
    return next(err);
});

module.exports = router;
