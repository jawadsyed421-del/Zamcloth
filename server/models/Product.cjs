const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    ageGroup: { type: String }, // For Kids: "2-3Y", "4-5Y", etc.
    sizes: [{ type: String }],
    colors: [{ type: String }],
    image: { type: String, required: true }, // main photo (first of images)
    images: [{ type: String }], // all photos, in display order
    imageColors: [{ type: String }], // colour name of each photo (same order as images), blank = all colours
    colorOptions: [{ _id: false, name: { type: String, required: true }, hex: { type: String, default: '#9ca3af' } }],
    stock: { type: Number, default: 0, min: 0 },
    isNew: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
