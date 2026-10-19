const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Get Razorpay Key ID
// @route   GET /api/payment/key
router.get('/key', (req, res) => {
    res.send(process.env.RAZORPAY_KEY_ID);
});

// @desc    Create Razorpay Order
// @route   POST /api/payment
// @access  Public
router.post('/', async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: req.body.amount, // amount in smallest currency unit
            currency: "INR",
            receipt: "receipt_order_" + Math.random().toString(36).substring(7),
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send("Some error occured");

        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
});

// @desc    Verify Payment Signature (Optional for backend verification)
// @route   POST /api/payment/verify
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

module.exports = router;
