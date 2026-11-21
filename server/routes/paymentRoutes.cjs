const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order.cjs');
const Product = require('../models/Product.cjs');
const Transaction = require('../models/Transaction.cjs');
const { requireUser, requireAdmin, safeEqual } = require('../middleware/auth.cjs');
const { notifyOrderPaid } = require('../utils/mailer.cjs');
const { createWorkbook } = require('../utils/spreadsheets.cjs');

const router = express.Router();

// ---- Cashfree helpers -------------------------------------------------------------------------
// Keys come from .env: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (sandbox | production)
const API_VERSION = '2023-08-01';
const mode = () => (process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox');
const baseUrl = () => process.env.CASHFREE_API_URL || (mode() === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg');
const configured = () => Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

const cashfree = async (path, options = {}) => {
    const res = await fetch(`${baseUrl()}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': API_VERSION,
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            ...options.headers,
        },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(body.message || `Cashfree error ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return body;
};

const siteUrl = (req) => (process.env.SITE_URL || req.headers.origin || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

const ownOrder = async (req) => {
    if (!mongoose.isValidObjectId(req.body?.orderId)) return null;
    const order = await Order.findById(req.body.orderId);
    return order && String(order.user) === req.auth.sub ? order : null;
};

// Marks a transaction paid exactly once (the return page and the webhook can both arrive), then
// marks the order paid and reduces stock.
const settle = async (transaction, payment) => {
    const won = await Transaction.findOneAndUpdate(
        { _id: transaction._id, status: { $ne: 'paid' } },
        {
            status: 'paid',
            paidAt: new Date(),
            failureReason: undefined,
            gatewayPaymentId: String(payment.cf_payment_id || ''),
            method: String(payment.payment_group || '').replace(/_/g, ' '),
        },
        { new: true }
    );
    if (!won) return false; // already settled

    const order = await Order.findById(transaction.order);
    if (!order || order.isPaid) return true;
    order.isPaid = true;
    order.paidAt = won.paidAt;
    order.status = 'processing';
    await order.save();
    for (const item of order.orderItems) {
        await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
    }
    await notifyOrderPaid(order, won).catch(e => console.error('Order email error:', e.message));
    return true;
};

// Asks Cashfree what really happened to a payment and records it. Never trusts the browser.
const refresh = async (transaction) => {
    const cfOrder = await cashfree(`/orders/${encodeURIComponent(transaction.gatewayOrderId)}`);
    if (cfOrder.order_status === 'PAID') {
        const payments = await cashfree(`/orders/${encodeURIComponent(transaction.gatewayOrderId)}/payments`);
        const ok = (Array.isArray(payments) ? payments : []).find(p => p.payment_status === 'SUCCESS');
        if (ok && Math.abs(Number(ok.payment_amount) - transaction.amount) < 0.01) {
            await settle(transaction, ok);
            return 'paid';
        }
        await Transaction.updateOne({ _id: transaction._id }, { status: 'failed', failureReason: 'Paid amount did not match the order' });
        return 'failed';
    }
    if (cfOrder.order_status === 'EXPIRED' || cfOrder.order_status === 'TERMINATED') {
        await Transaction.updateOne({ _id: transaction._id, status: 'created' }, { status: 'failed', failureReason: 'Payment not completed' });
        return 'failed';
    }
    return 'pending';
};

// ---- Routes ---------------------------------------------------------------------------------

// Public: tells the browser which Cashfree environment to open
router.get('/config', (req, res) => res.json({
    configured: configured(), mode: mode(), gstin: process.env.COMPANY_GSTIN || '',
}));

// Start a payment for one of my unpaid orders. The amount comes from the saved order.
router.post('/create', requireUser, async (req, res) => {
    try {
        if (!configured()) return res.status(503).json({ message: 'Online payments are not set up yet (Cashfree keys missing).' });
        const order = await ownOrder(req);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.isPaid) return res.status(409).json({ message: 'This order is already paid' });

        // Partial COD orders only pay the advance online; the balance is collected at delivery
        const payNow = order.paymentMethod === 'Partial COD' ? order.advanceAmount : order.totalPrice;
        const a = order.shippingAddress;
        const phone = String(a.phone).replace(/\D/g, '').slice(-10);
        if (phone.length !== 10) return res.status(400).json({ message: 'Enter a valid 10-digit phone number' });

        const gatewayOrderId = `ZAM_${order._id}_${Date.now().toString(36)}`;
        const cf = await cashfree('/orders', {
            method: 'POST',
            body: JSON.stringify({
                order_id: gatewayOrderId,
                order_amount: Number(payNow.toFixed(2)),
                order_currency: 'INR',
                order_note: `Zamcloth order ${order._id}`,
                customer_details: {
                    customer_id: String(order.user),
                    customer_name: a.fullName,
                    customer_email: a.email,
                    customer_phone: phone,
                },
                order_meta: { return_url: `${siteUrl(req)}/payment-status?order=${order._id}` },
            }),
        });

        await Transaction.create({
            order: order._id, user: order.user, gateway: 'Cashfree', gatewayOrderId, amount: payNow, currency: 'INR',
            customerName: a.fullName, customerEmail: a.email, customerPhone: phone,
        });
        res.json({ paymentSessionId: cf.payment_session_id, gatewayOrderId, mode: mode() });
    } catch (error) {
        console.error('Cashfree create failed:', {
            status: error.status || null,
            message: error.message,
        });
        const gatewayDetail = error.status && error.message
            ? `Cashfree rejected the request (${error.status}: ${error.message}).`
            : 'Could not start the payment. Please try again.';
        res.status(502).json({ message: gatewayDetail });
    }
});

// Confirm a payment by asking Cashfree directly, then mark the order paid.
router.post('/verify', requireUser, async (req, res) => {
    try {
        const order = await ownOrder(req);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const transactions = await Transaction.find({ order: order._id }).sort({ createdAt: -1 });
        if (transactions.length === 0) return res.status(400).json({ message: 'No payment was started for this order' });

        // paid if any attempt was paid; otherwise pending if any attempt is still open; otherwise failed
        const outcomes = [];
        for (const t of transactions) {
            if (t.status === 'paid') { outcomes.push('paid'); break; }
            const r = await refresh(t);
            outcomes.push(r);
            if (r === 'paid') break;
        }
        const result = outcomes.includes('paid') ? 'paid' : outcomes.includes('pending') ? 'pending' : 'failed';
        const paid = result === 'paid' && await Transaction.findOne({ order: order._id, status: 'paid' });
        if (paid) await notifyOrderPaid(await Order.findById(order._id), paid).catch(e => console.error('Order email error:', e.message));
        res.json({
            status: result,
            order: await Order.findById(order._id),
            payment: paid ? { paymentId: paid.gatewayPaymentId, referenceId: paid.gatewayOrderId, method: paid.method, amount: paid.amount } : null,
        });
    } catch (error) {
        console.error('Cashfree verify failed:', error.message);
        res.status(502).json({ message: 'Could not confirm the payment right now' });
    }
});

// Customer closed the payment window or it failed
router.post('/failed', requireUser, async (req, res) => {
    const order = await ownOrder(req);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await Transaction.updateMany(
        { order: order._id, status: 'created' },
        { status: 'failed', failureReason: String(req.body?.reason || 'Payment not completed').slice(0, 200) }
    );
    res.json({ ok: true });
});

// Cashfree calls this when a payment finishes, even if the customer closed the tab.
// Set it in the Cashfree dashboard: https://YOUR-SITE/api/payment/webhook
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.get('x-webhook-signature');
        const timestamp = req.get('x-webhook-timestamp');
        if (!configured() || !signature || !timestamp || !req.rawBody) return res.status(400).end();
        const expected = crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
            .update(timestamp + req.rawBody.toString('utf8')).digest('base64');
        if (!safeEqual(expected, signature)) return res.status(401).end();

        const gatewayOrderId = req.body?.data?.order?.order_id;
        const transaction = gatewayOrderId && await Transaction.findOne({ gatewayOrderId: String(gatewayOrderId) });
        if (transaction) await refresh(transaction); // re-checks with Cashfree instead of trusting the payload
        res.json({ ok: true });
    } catch (error) {
        console.error('Cashfree webhook failed:', error.message);
        res.status(500).end();
    }
});

// Admin: every payment attempt with the customer's details
router.get('/transactions', requireAdmin, async (req, res) => {
    const list = await Transaction.find({}).sort({ createdAt: -1 }).limit(500)
        .populate('order', 'paymentMethod totalPrice status shippingAddress externalOrderNumber').lean();
    res.json(list);
});

router.get('/monthly-report', requireAdmin, async (req, res) => {
    const month = String(req.query.month || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: 'Choose a valid report month' });
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1) - 330 * 60 * 1000);
    const end = new Date(Date.UTC(year, monthNumber, 1) - 330 * 60 * 1000);
    const period = { $gte: start, $lt: end };

    try {
        const [orders, payments, codCollections] = await Promise.all([
            Order.find({ createdAt: period }).sort({ createdAt: 1 }).populate('user', 'name email').lean(),
            Transaction.find({ status: 'paid', paidAt: period }).sort({ paidAt: 1 }).populate('order', 'externalOrderNumber shippingAddress').lean(),
            Order.find({ codCollectedAt: period }).sort({ codCollectedAt: 1 }).lean(),
        ]);
        const gstin = process.env.COMPANY_GSTIN || 'Not configured';
        const paymentRows = payments.map(payment => ({
            Date: payment.paidAt,
            'Order number': payment.order?.externalOrderNumber || (payment.order?._id ? `ZAM-${String(payment.order._id).slice(-6).toUpperCase()}` : ''),
            Customer: payment.customerName || payment.order?.shippingAddress?.fullName || '',
            Email: payment.customerEmail || payment.order?.shippingAddress?.email || '',
            Type: /offline/i.test(payment.gateway) || payment.method === 'Offline' ? 'Offline' : 'Online',
            Method: payment.method || payment.gateway,
            Reference: payment.gatewayPaymentId || payment.gatewayOrderId,
            Amount: payment.amount,
            Currency: payment.currency || 'INR',
            'GSTIN (company)': gstin,
        }));
        codCollections.forEach(order => paymentRows.push({
            Date: order.codCollectedAt,
            'Order number': order.externalOrderNumber || `ZAM-${String(order._id).slice(-6).toUpperCase()}`,
            Customer: order.shippingAddress.fullName,
            Email: order.shippingAddress.email,
            Type: 'Offline',
            Method: 'COD collected',
            Reference: order._id,
            Amount: order.codCollectedAmount,
            Currency: 'INR',
            'GSTIN (company)': gstin,
        }));
        const onlineTotal = paymentRows.filter(row => row.Type === 'Online').reduce((sum, row) => sum + Number(row.Amount || 0), 0);
        const offlineTotal = paymentRows.filter(row => row.Type === 'Offline').reduce((sum, row) => sum + Number(row.Amount || 0), 0);
        const orderTotal = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
        const outstandingCod = orders.reduce((sum, order) =>
            sum + Math.max(0, Number(order.codBalance || 0) - Number(order.codCollectedAmount || 0)), 0);
        const orderRows = orders.map(order => ({
            Date: order.createdAt,
            'Order number': order.externalOrderNumber || `ZAM-${String(order._id).slice(-6).toUpperCase()}`,
            Customer: order.shippingAddress.fullName,
            Email: order.shippingAddress.email,
            Phone: order.shippingAddress.phone,
            'Payment method': order.paymentMethod,
            Status: order.status,
            Subtotal: order.itemsPrice,
            Discount: order.discountPrice,
            Shipping: order.shippingPrice,
            Tax: order.taxPrice,
            'Order total': order.totalPrice,
            'COD due': Math.max(0, Number(order.codBalance || 0) - Number(order.codCollectedAmount || 0)),
            'GSTIN (company)': gstin,
        }));
        const summaryRows = [
            { Metric: 'Report month', Value: month },
            { Metric: 'Company', Value: 'Zamcloth Pvt. Ltd.' },
            { Metric: 'GSTIN (company)', Value: gstin },
            { Metric: 'Orders placed', Value: orders.length },
            { Metric: 'Order value', Value: orderTotal },
            { Metric: 'Online payments received', Value: onlineTotal },
            { Metric: 'Offline / COD payments received', Value: offlineTotal },
            { Metric: 'Total payments received', Value: onlineTotal + offlineTotal },
            { Metric: 'COD outstanding on orders placed this month', Value: outstandingCod },
        ];
        const buffer = await createWorkbook([
            { name: 'Monthly Summary', columns: ['Metric', 'Value'], rows: summaryRows },
            { name: 'Orders', columns: ['Date', 'Order number', 'Customer', 'Email', 'Phone', 'Payment method', 'Status', 'Subtotal', 'Discount', 'Shipping', 'Tax', 'Order total', 'COD due', 'GSTIN (company)'], rows: orderRows },
            { name: 'Payments', columns: ['Date', 'Order number', 'Customer', 'Email', 'Type', 'Method', 'Reference', 'Amount', 'Currency', 'GSTIN (company)'], rows: paymentRows },
        ]);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="zamcloth-${month}-report.xlsx"`,
            'Content-Length': buffer.length,
        });
        res.send(buffer);
    } catch (error) {
        console.error('Monthly report generation failed:', error.message);
        res.status(500).json({ message: 'Could not generate the monthly report' });
    }
});

module.exports = router;
