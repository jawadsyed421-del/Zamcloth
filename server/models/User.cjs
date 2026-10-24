const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    lastLoginAt: { type: Date },
    // Saved delivery addresses so a returning customer does not retype them
    addresses: [{
        fullName: { type: String, required: true, trim: true, maxlength: 100 },
        phone: { type: String, required: true, trim: true, maxlength: 10 },
        email: { type: String, trim: true, maxlength: 120 },
        address: { type: String, required: true, trim: true, maxlength: 200 },
        city: { type: String, required: true, trim: true, maxlength: 80 },
        postalCode: { type: String, required: true, trim: true, maxlength: 6 },
        isDefault: { type: Boolean, default: false },
    }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
