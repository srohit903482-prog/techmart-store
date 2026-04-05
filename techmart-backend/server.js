const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Sample products
const products = [
  { id: 1, name: 'Dell XPS 15', category: 'Laptops', price: 1299, stock: 10 },
  { id: 2, name: 'MacBook Pro 14', category: 'Laptops', price: 1999, stock: 5 },
  { id: 3, name: 'HP LaserJet Pro', category: 'Printers', price: 399, stock: 7 },
  { id: 4, name: 'Logitech MX Master 3S', category: 'Accessories', price: 89, stock: 20 },
  { id: 5, name: 'Microsoft Office 2024', category: 'Software', price: 149, stock: 50 }
];

// In-memory cart
let carts = {};

// ============ ROOT ENDPOINT ============
app.get('/', (req, res) => {
  res.json({ message: 'TechMart API is running!' });
});

// ============ PRODUCT ROUTES ============
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// ============ CART ROUTES ============
app.get('/api/cart', (req, res) => {
  const userId = req.headers['user-id'] || 'default';
  const cart = carts[userId] || [];
  res.json({ items: cart });
});

app.post('/api/cart', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.headers['user-id'] || 'default';
  
  if (!carts[userId]) carts[userId] = [];
  
  const existing = carts[userId].find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    carts[userId].push({ productId, quantity });
  }
  
  res.json({ message: 'Added to cart', cart: carts[userId] });
});

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  res.json({ 
    success: true,
    message: 'Registration successful', 
    token: 'fake-jwt-token-12345',
    user: { id: Date.now(), email, name: name || email.split('@')[0] }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  res.json({ 
    success: true,
    message: 'Login successful', 
    token: 'fake-jwt-token-12345',
    user: { id: Date.now(), email, name: email.split('@')[0] }
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
