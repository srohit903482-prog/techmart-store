const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Sample products data (computers, laptops, printers, accessories, software)
const products = [
  { id: 1, name: 'Dell XPS 15', category: 'Laptops', price: 1299, stock: 10, image: 'laptop1' },
  { id: 2, name: 'MacBook Pro 14', category: 'Laptops', price: 1999, stock: 5, image: 'laptop2' },
  { id: 3, name: 'HP Spectre x360', category: 'Laptops', price: 1199, stock: 8, image: 'laptop3' },
  { id: 4, name: 'Dell OptiPlex Desktop', category: 'Computers', price: 899, stock: 15, image: 'desktop1' },
  { id: 5, name: 'HP Elite Desktop', category: 'Computers', price: 1099, stock: 12, image: 'desktop2' },
  { id: 6, name: 'HP LaserJet Pro', category: 'Printers', price: 399, stock: 7, image: 'printer1' },
  { id: 7, name: 'Epson EcoTank', category: 'Printers', price: 499, stock: 6, image: 'printer2' },
  { id: 8, name: 'Logitech MX Master 3S', category: 'Accessories', price: 89, stock: 20, image: 'mouse' },
  { id: 9, name: 'Logitech Mechanical Keyboard', category: 'Accessories', price: 129, stock: 15, image: 'keyboard' },
  { id: 10, name: 'Microsoft Office 2024', category: 'Software', price: 149, stock: 50, image: 'office' },
  { id: 11, name: 'Adobe Creative Cloud', category: 'Software', price: 599, stock: 30, image: 'adobe' },
  { id: 12, name: 'Dell 27" Monitor', category: 'Accessories', price: 249, stock: 18, image: 'monitor' }
];

// Temporary in-memory cart (will reset on server restart)
let carts = {};

// ============ API ENDPOINTS ============

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'TechMart API is running!', endpoints: ['/api/products', '/api/cart', '/api/auth/register', '/api/auth/login'] });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Get products by category
app.get('/api/products/category/:category', (req, res) => {
  const categoryProducts = products.filter(p => p.category.toLowerCase() === req.params.category.toLowerCase());
  res.json(categoryProducts);
});

// Get cart for a user (using userId from header for demo)
app.get('/api/cart', (req, res) => {
  const userId = req.headers['user-id'] || 'default';
  const userCart = carts[userId] || [];
  const cartItems = userCart.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)
  }));
  res.json({ items: cartItems, total: cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) });
});

// Add to cart
app.post('/api/cart', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.headers['user-id'] || 'default';
  
  if (!carts[userId]) carts[userId] = [];
  
  const existingItem = carts[userId].find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].push({ productId, quantity });
  }
  
  res.json({ message: 'Added to cart', cart: carts[userId] });
});

// Remove from cart
app.delete('/api/cart/:productId', (req, res) => {
  const userId = req.headers['user-id'] || 'default';
  const productId = parseInt(req.params.productId);
  
  if (carts[userId]) {
    carts[userId] = carts[userId].filter(item => item.productId !== productId);
  }
  
  res.json({ message: 'Removed from cart' });
});

// Update cart quantity
app.put('/api/cart/:productId', (req, res) => {
  const { quantity } = req.body;
  const userId = req.headers['user-id'] || 'default';
  const productId = parseInt(req.params.productId);
  
  if (carts[userId]) {
    const item = carts[userId].find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        carts[userId] = carts[userId].filter(i => i.productId !== productId);
      }
    }
  }
  
  res.json({ message: 'Cart updated' });
});

// User registration (simple version)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  // In production, save to database. For demo, just return success
  res.json({ 
    message: 'Registration successful', 
    token: 'demo-token-12345',
    user: { id: Date.now(), email, name }
  });
});

// User login (simple version)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // In production, verify credentials. For demo, accept anything
  res.json({ 
    message: 'Login successful', 
    token: 'demo-token-12345',
    user: { id: Date.now(), email, name: email.split('@')[0] }
  });
});

// Create order (checkout)
app.post('/api/orders', (req, res) => {
  const userId = req.headers['user-id'] || 'default';
  const { shippingAddress, paymentMethod } = req.body;
  
  const userCart = carts[userId] || [];
  const orderItems = userCart.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    product: products.find(p => p.id === item.productId)
  }));
  
  const total = orderItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  
  // Clear cart after order
  carts[userId] = [];
  
  res.json({
    message: 'Order created successfully',
    order: {
      id: Date.now(),
      items: orderItems,
      total,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API: http://localhost:${PORT}/api/products`);
});