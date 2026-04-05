const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* ================= AUTH ROUTES ================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const user = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, hash]
    );

    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!valid)
      return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= PRODUCTS ================= */
app.get("/api/products", async (req, res) => {
  try {
    const products = await pool.query("SELECT * FROM products");
    res.json(products.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= CART ================= */
app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    const cart = await pool.query(
      `SELECT cart_items.id, products.name, products.price, cart_items.quantity
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = $1`,
      [req.user.id]
    );
    res.json(cart.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cart", authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    const item = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, product_id, quantity]
    );

    res.json(item.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/cart/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM cart_items WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ORDERS ================= */
app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const cart = await pool.query(
      `SELECT products.price, cart_items.quantity
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = $1`,
      [req.user.id]
    );

    let total = 0;
    cart.rows.forEach(item => {
      total += item.price * item.quantity;
    });

    const order = await pool.query(
      `INSERT INTO orders (user_id, total, status)
       VALUES ($1, $2, 'completed') RETURNING *`,
      [req.user.id, total]
    );

    await pool.query(
      "DELETE FROM cart_items WHERE user_id = $1",
      [req.user.id]
    );

    res.json(order.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});