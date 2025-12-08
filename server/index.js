const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./config/db'); // Panggil koneksi database

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route (Cek apakah server hidup)
app.get('/', (req, res) => {
    res.send('🚀 CarbonTrack Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});