const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    lastLoginAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
