const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.getConnection((err) => {
    if (err) {
        console.error('Gagal konek ke DB', err);
    } else {
        console.log('Mantap! Terkoneksi ke Database MySQL');
    }
});

const midtransClient = require('midtrans-client');

let snap = new midtransClient.Snap({
    isProduction : false,
    serverKey : process.env.MIDTRANS_SERVER_KEY
});

// ================= CHECKOUT API =================
app.post('/checkout', (req, res) => {
    const { user_id, items, total_amount } = req.body;

    console.log("=== REQUEST MASUK ===");
    console.log("User ID:", user_id);
    console.log("Total:", total_amount);
    console.log("Items:", JSON.stringify(items, null, 2));

    if (!user_id) return res.status(400).json({ message: "User ID wajib ada!" });

    const queryUser = 'SELECT * FROM users WHERE id = ?';
    db.query(queryUser, [user_id], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        const userData = result[0];

        let midtransItems = items.map(item => {
            return {
                id: item.id.toString(),
                price: parseInt(item.promo ?? item.price),
                quantity: 1,
                name: item.name
            };
        });

        let realTotal = 0;
        midtransItems.forEach(item => {
            realTotal += ((item.promo ?? item.price) * item.quantity);
        });

        console.log("Items Bersih:", midtransItems);
        console.log("Total Hitungan Ulang:", realTotal);

        const orderId = `ORDER-${Date.now()}-${user_id}`;

        let parameter = {
            "transaction_details": {
                "order_id": orderId,
                "gross_amount": realTotal
            },
            "credit_card": { "secure" : true },
            "item_details": midtransItems,
            "customer_details": {
                "first_name": userData.name,
                "email": userData.email,
                "phone": userData.phone,
                "billing_address": {
                    "address": userData.address
                },
                "shipping_address": {
                    "first_name": userData.name,
                    "address": userData.address,
                    "phone": userData.phone
                }
            }
        };

        try {
            const transaction = await snap.createTransaction(parameter);
            const transactionToken = transaction.token;
            const redirectUrl = transaction.redirect_url;

            const insertOrderSql = "INSERT INTO orders (user_id, total_amount, status, created_at) VALUES (?, ?, 'PENDING', NOW())";
            db.query(insertOrderSql, [user_id, total_amount], (errOrder, resultOrder) => {
                if(errOrder) return res.status(500).json({error: errOrder.message});

                res.status(200).json({
                    message: "Order dibuat & User terdeteksi",
                    snap_token: transactionToken,
                    payment_url: redirectUrl
                });
            });

        } catch (e) {
            console.log("❌ MIDTRANS ERROR:", e.message);
            console.log("Detail Error:", JSON.stringify(e.ApiResponse, null, 2)); // INI PENTING
            res.status(500).json({ error: "Midtrans Error: " + e.message });
        }
    });
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
        const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailSql, [email], async (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (result.length > 0) {
                return res.status(400).json({ message: "Email sudah terdaftar bro!" });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
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