const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

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

// ================= REGISTER =================
app.post('/register', async (req, res) => {
    // Ambil data dari body request (yang dikirim Flutter)
    const { name, email, password, phone, address } = req.body;

    // Validasi simpel
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Nama, Email, dan Password wajib diisi!" });
    }

    try {
        // 1. Cek dulu, email udah kepake belum?
        const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailSql, [email], async (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (result.length > 0) {
                return res.status(400).json({ message: "Email sudah terdaftar bro!" });
            }

            // 2. Kalau aman, Hash passwordnya
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Masukin ke Database
            const insertSql = `INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)`;
            
            db.query(insertSql, [name, email, hashedPassword, phone, address], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                    message: "Registrasi Berhasil!",
                    data: {
                        id: result.insertId,
                        name: name,
                        email: email
                    }
                });
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ================= LOGIN =================
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email dan Password harus diisi!" });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Password salah!" });
        }
        res.status(200).json({
            message: "Login Berhasil",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    });
});

// ================= REGISTER =================
app.post('/register', async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    // Validasi simpel
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Nama, Email, dan Password wajib diisi!" });
    }

    try {
        const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailSql, [email], async (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (result.length > 0) {
                return res.status(400).json({ message: "Email sudah terdaftar." });
            }

            // 2. Kalau aman, Hash passwordnya
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Masukin ke Database
            const insertSql = `INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)`;
            
            db.query(insertSql, [name, email, hashedPassword, phone, address], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                    message: "Registrasi Berhasil!",
                    data: {
                        id: result.insertId,
                        name: name,
                        email: email
                    }
                });
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ================= LOGIN =================
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email dan Password harus diisi!" });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Password salah!" });
        }

        res.status(200).json({
            message: "Login Berhasil",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server lari di http://localhost:${PORT}`);
});