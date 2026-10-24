const mongoose = require('mongoose');

// One document holds the home page banner photos, in display order (stored in the Image collection).
const heroSchema = mongoose.Schema({
    key: { type: String, default: 'home', unique: true },
    images: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Hero', heroSchema);
