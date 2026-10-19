const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./server/config/db.cjs');
const Product = require('./server/models/Product.cjs');

dotenv.config();

const seedProducts = [
    // --- KIDS: BOYS ---
    {
        name: "Classic Denim Jacket",
        price: 899,
        category: "Kids",
        subcategory: "Boys",
        ageGroup: "4-5Y",
        sizes: ["4-5Y", "6-7Y", "8-9Y"],
        colors: ["Blue"],
        image: "https://images.unsplash.com/photo-1519238809107-744f64a27040?q=80&w=2075&auto=format&fit=crop",
        description: "Durable and stylish denim jacket for everyday adventures.",
        isNew: true
    },
    {
        name: "Cotton Graphic T-Shirt",
        price: 399,
        category: "Kids",
        subcategory: "Boys",
        ageGroup: "2-3Y",
        sizes: ["2-3Y", "4-5Y", "6-7Y"],
        colors: ["White", "Red"],
        image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=1935&auto=format&fit=crop",
        description: "Soft cotton tee with fun graphic prints.",
        isTrending: true
    },
    {
        name: "Festive Kurta Set",
        price: 1299,
        category: "Kids",
        subcategory: "Ethnic Wear",
        ageGroup: "6-7Y",
        sizes: ["4-5Y", "6-7Y", "8-9Y"],
        colors: ["Yellow"],
        image: "https://images.unsplash.com/photo-1609357912383-9b56f8206584?q=80&w=1887&auto=format&fit=crop",
        description: "Traditional yellow kurta paired with white pyjamas.",
        isNew: true
    },

    // --- KIDS: GIRLS ---
    {
        name: "Floral Summer Frock",
        price: 799,
        category: "Kids",
        subcategory: "Girls",
        ageGroup: "4-5Y",
        sizes: ["2-3Y", "4-5Y", "6-7Y"],
        colors: ["Pink"],
        image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=1925&auto=format&fit=crop",
        description: "Lightweight cotton frock with beautiful floral patterns.",
        isTrending: true
    },
    {
        name: "Embroidery Lehenga Set",
        price: 2499,
        category: "Kids",
        subcategory: "Ethnic Wear",
        ageGroup: "8-9Y",
        sizes: ["6-7Y", "8-9Y", "10-11Y"],
        colors: ["Red"],
        image: "https://images.unsplash.com/photo-1601666802116-3e0e7a2b9794?q=80&w=1937&auto=format&fit=crop",
        description: "Intricate embroidery lehenga perfect for weddings and festivals.",
        isNew: true
    },

    // --- WOMEN ---
    {
        name: "Elegant Anarkali Kurti",
        price: 1899,
        category: "Women",
        subcategory: "Kurtis",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Green"],
        image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1974&auto=format&fit=crop",
        description: "Flowy Anarkali kurti with golden border details.",
        isTrending: true
    },
    {
        name: "Chic Co-ord Set",
        price: 1499,
        category: "Women",
        subcategory: "Co-ord Sets",
        sizes: ["S", "M", "L"],
        colors: ["Beige"],
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2020&auto=format&fit=crop",
        description: "Modern two-piece co-ord set for a sophisticated look.",
        isNew: true
    },
    {
        name: "Silk Saree",
        price: 3500,
        category: "Women",
        subcategory: "Ethnic Wear",
        sizes: ["Free Size"],
        colors: ["Purple"],
        image: "https://images.unsplash.com/photo-1610030469983-98e55041d04b?q=80&w=1887&auto=format&fit=crop",
        description: "Rich silk saree with traditional zari work.",
    }
];

const seed = async () => {
    try {
        await connectDB();
        await Product.deleteMany();
        await Product.insertMany(seedProducts);
        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seed();
