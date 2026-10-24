const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order.cjs');
const Product = require('../models/Product.cjs');
const Transaction = require('../models/Transaction.cjs');
const { requireUser, requireAdmin, requireAny } = require('../middleware/auth.cjs');

const router = express.Router();

const PREPAID_DISCOUNT_PERCENT = 5;
const COD_ADVANCE = 99;
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
            orderItems.push({ product: product._id, name: product.name, image: itemImage, price: product.price, quantity: qty, size: str(item.size, 20), color });
            itemsPrice += product.price * qty;
        }

        // Extra 5% off for prepaid (online) orders only
        const discountPrice = partialCod ? 0 : Math.round(itemsPrice * PREPAID_DISCOUNT_PERCENT) / 100;
        const totalPrice = itemsPrice - discountPrice;
        if (partialCod && totalPrice <= COD_ADVANCE) {
            return res.status(400).json({ message: `Partial COD is available on orders above ₹${COD_ADVANCE}` });
        }

        const order = await Order.create({
            user: req.auth.sub, orderItems, shippingAddress: address,
            paymentMethod: partialCod ? 'Partial COD' : 'Online',
            itemsPrice, discountPrice, taxPrice: 0, shippingPrice: 0, totalPrice,
            advanceAmount: partialCod ? COD_ADVANCE : 0,
            codBalance: partialCod ? totalPrice - COD_ADVANCE : 0,
        });
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
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

module.exports = router;
