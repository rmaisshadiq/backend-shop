const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_ecommerce'
});

// Cek koneksi (Optional, buat mastiin aja)
db.getConnection((err) => {
    if (err) {
        console.error('Gagal konek ke DB bro:', err);
    } else {
        console.log('Mantap! Terkoneksi ke Database MySQL');
    }
});

// ================= RUTE API =================

app.get('/', (req, res) => {
    res.send('Backend E-Commerce Jalan Bos!');
});

app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM product_items';

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Kalau sukses, kirim data JSON
        res.status(200).json({
            message: "Berhasil ambil data produk",
            data: result
        });
    });
});

app.get('/products/electronics', (req, res) => {
    const sql = 'SELECT * FROM product_items WHERE category = "electronic"';

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Kalau sukses, kirim data JSON
        res.status(200).json({
            message: "Berhasil ambil data produk",
            data: result
        });
    });
});

app.get('/products/clothes', (req, res) => {
    const sql = 'SELECT * FROM product_items WHERE category = "baju pria"';

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Kalau sukses, kirim data JSON
        res.status(200).json({
            message: "Berhasil ambil data produk",
            data: result
        });
    });
});

app.get('/products/dresses', (req, res) => {
    const sql = 'SELECT * FROM product_items WHERE category = "baju wanita"';

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Kalau sukses, kirim data JSON
        res.status(200).json({
            message: "Berhasil ambil data produk",
            data: result
        });
    });
});

app.get('/products/shoes', (req, res) => {
    const sql = 'SELECT * FROM product_items WHERE category = "sepatu pria"';

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Kalau sukses, kirim data JSON
        res.status(200).json({
            message: "Berhasil ambil data produk",
            data: result
        });
    });
});

app.get('/products/heels', (req, res) => {
    const sql = 'SELECT * FROM product_items WHERE category = "sepatu wanita"';

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Kalau sukses, kirim data JSON
        res.status(200).json({
            message: "Berhasil ambil data produk",
            data: result
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server lari di http://localhost:${PORT}`);
});