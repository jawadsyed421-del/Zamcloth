const mongoose = require('mongoose');

// Product photos are stored in the database so they survive restarts and redeploys on hosts
// with temporary disks (such as Render's free plan).
const imageSchema = mongoose.Schema({
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
