const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./config/db'); // Panggil koneksi database

const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('🚀 CarbonTrack Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});