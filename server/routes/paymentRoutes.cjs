const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order.cjs');
const Product = require('../models/Product.cjs');
const Transaction = require('../models/Transaction.cjs');
const { requireUser, safeEqual } = require('../middleware/auth.cjs');

const router = express.Router();

// Public key id only (never the secret)
router.get('/key', (req, res) => res.send(process.env.RAZORPAY_KEY_ID || ''));

const ownOrder = async (req) => {
    if (!mongoose.isValidObjectId(req.body?.orderId)) return null;
    const order = await Order.findById(req.body.orderId);
    return order && String(order.user) === req.auth.sub ? order : null;
};

// Start a payment for one of my unpaid orders. The amount comes from the saved order.
router.post('/create', requireUser, async (req, res) => {
    try {
        const order = await ownOrder(req);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.isPaid) return res.status(409).json({ message: 'This order is already paid' });

        const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const gatewayOrder = await instance.orders.create({
            amount: Math.round(order.totalPrice * 100), // paise
            currency: 'INR',
            receipt: String(order._id),
        });

        await Transaction.create({
            order: order._id, user: order.user, gatewayOrderId: gatewayOrder.id, amount: order.totalPrice, currency: 'INR',
        });
        res.json(gatewayOrder);
    } catch (error) {
        res.status(502).json({ message: 'Could not start the payment. Please try again.' });
    }
});

// Confirm a payment: verify the gateway signature, then mark paid and reduce stock.
router.post('/verify', requireUser, async (req, res) => {
    try {
        const order = await ownOrder(req);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { razorpay_order_id: gwOrderId, razorpay_payment_id: gwPaymentId, razorpay_signature: signature } = req.body;
        const transaction = await Transaction.findOne({ order: order._id, gatewayOrderId: String(gwOrderId) });
        if (!transaction) return res.status(400).json({ message: 'Unknown payment' });

        const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${gwOrderId}|${gwPaymentId}`).digest('hex');
        if (!safeEqual(expected, String(signature))) {
            transaction.status = 'failed';
            transaction.failureReason = 'Invalid signature';
            await transaction.save();
            return res.status(400).json({ message: 'Payment could not be verified' });
        }
        if (transaction.status === 'paid') return res.json({ message: 'Payment verified', order });

        transaction.status = 'paid';
        transaction.gatewayPaymentId = String(gwPaymentId);
        transaction.paidAt = new Date();
        await transaction.save();

        order.isPaid = true;
        order.paidAt = transaction.paidAt;
        order.status = 'processing';
        await order.save();

        for (const item of order.orderItems) {
            await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
        }
        res.json({ message: 'Payment verified', order });
    } catch (error) {
        res.status(500).json({ message: 'Could not confirm the payment' });
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

module.exports = router;
