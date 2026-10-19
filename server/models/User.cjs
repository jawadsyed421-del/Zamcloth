const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    lastLoginAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
