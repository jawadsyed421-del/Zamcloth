const mongoose = require('mongoose');

// One record per payment attempt, so every payment can be traced back to an order and customer.
const transactionSchema = mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gateway: { type: String, default: 'Cashfree' },
    gatewayOrderId: { type: String, required: true, unique: true },
    gatewayPaymentId: { type: String },
    method: { type: String }, // card, upi, netbanking...
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    amount: { type: Number, required: true }, // rupees
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    paidAt: { type: Date },
    failureReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
