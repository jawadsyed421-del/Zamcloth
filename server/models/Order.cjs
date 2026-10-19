const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            size: { type: String },
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        },
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true, default: 'India' },
    },
    paymentMethod: { type: String, required: true, default: 'Razorpay' },
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    status: {
        type: String,
        enum: ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending_payment',
    },
    deliveredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
