const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db.cjs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false }));
app.use('/api/admin', require('./routes/adminRoutes.cjs'));
app.use('/api/products', require('./routes/productRoutes.cjs'));
app.use('/api/orders', require('./routes/orderRoutes.cjs'));
app.use('/api/payment', require('./routes/paymentRoutes.cjs'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
