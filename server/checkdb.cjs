// Run with: npm run check:db
// Confirms the MONGO_URI in .env works and that every collection and the admin account are in place.
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User.cjs');
const Admin = require('./models/Admin.cjs');
const Product = require('./models/Product.cjs');
const Order = require('./models/Order.cjs');
const Transaction = require('./models/Transaction.cjs');
const { syncAdminFromEnv } = require('./routes/adminRoutes.cjs');

const required = ['MONGO_URI', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_TOKEN_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];

(async () => {
    let ok = true;
    for (const key of required) {
        const set = !!process.env[key];
        ok = ok && set;
        console.log(`${set ? 'OK     ' : 'MISSING'} ${key}`);
    }
    if (process.env.ADMIN_TOKEN_SECRET && process.env.ADMIN_TOKEN_SECRET.length < 32) {
        ok = false;
        console.log('WEAK    ADMIN_TOKEN_SECRET should be at least 32 characters');
    }
    if (!process.env.MONGO_URI) process.exit(1);

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log(`OK      Connected to ${conn.connection.host} / database "${conn.connection.name}"`);

        // Create collections and indexes if they do not exist yet
        await Promise.all([User, Admin, Product, Order, Transaction].map(m => m.createCollection().catch(() => { })));
        await Promise.all([User, Admin, Product, Order, Transaction].map(m => m.syncIndexes()));
        await syncAdminFromEnv();

        for (const [name, model] of Object.entries({ users: User, admins: Admin, products: Product, orders: Order, transactions: Transaction })) {
            console.log(`OK      ${name.padEnd(13)} ${await model.countDocuments()} records`);
        }
    } catch (error) {
        ok = false;
        console.log(`FAILED  ${error.message}`);
    }
    await mongoose.disconnect();
    console.log(ok ? '\nAll checks passed.' : '\nSome checks failed. Fix the items above and run again.');
    process.exit(ok ? 0 : 1);
})();
