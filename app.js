const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// Database and Controllers & Middleware
const db = require('./config/db');
const comboController = require('./controllers/comboController');
const orderController = require('./controllers/orderController');
const authController = require('./controllers/authController');

const verifyToken = (req, res, next) => {
  // Temporary bypass for local development/admin testing
  next();
};

const app = express();

// --- 1. Proper CORS Configuration (Placed at the top!) ---
app.use(cors({
  origin: [
    'https://furniture-frontend-beta-seven.vercel.app', 
    'http://localhost:5173', 
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// --- Ensure uploads directory exists & serve statically ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// --- Configure Multer storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max limit
});

// ==================== ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend running smoothly.' });
});

// Auth Endpoints
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Public Products & Combos
app.get('/api/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY product_id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching public products:', err.message);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/combos/:comboId', comboController.getComboDetails);

// Order Routes
app.post('/api/orders/calculate-delivery', orderController.calculateDeliveryFee);
app.post('/api/orders/create', orderController.createOrder);
app.post('/api/orders', orderController.createOrder);

// Admin Get Routes
app.get('/api/admin/orders', orderController.getAllOrders);
app.get('/api/admin/products', comboController.getAllProducts); 

// --- 2. Dynamic Image Upload Endpoint (Works locally and on Render) ---
app.post('/api/admin/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Admin Create Product (POST) - supports both /api/products and /api/admin/products
const createProductHandler = async (req, res) => {
  const { name, sku, base_price, stock_quantity, material, craft_origin, care_instructions, image_url } = req.body;
  try {
    const generatedSku = sku || `SKU-${Date.now()}`;
    const query = `
      INSERT INTO products (name, sku, base_price, stock_quantity, material, craft_origin, care_instructions, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      name,
      generatedSku,
      parseFloat(base_price),
      parseInt(stock_quantity, 10) || 0,
      material || '',
      craft_origin || '',
      care_instructions || '',
      image_url || ''
    ];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

app.post('/api/products', verifyToken, createProductHandler);
app.post('/api/admin/products', verifyToken, createProductHandler);

// Admin Update Product (PUT)
app.put('/api/admin/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, sku, base_price, stock_quantity, material, craft_origin, care_instructions, image_url } = req.body;
  try {
    const query = `
      UPDATE products 
      SET name = $1, sku = $2, base_price = $3, stock_quantity = $4, material = $5, craft_origin = $6, care_instructions = $7, image_url = $8
      WHERE product_id = $9
      RETURNING *;
    `;
    const values = [
      name,
      sku,
      base_price,
      stock_quantity,
      material,
      craft_origin,
      care_instructions,
      image_url,
      id
    ];
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Delete Product (DELETE)
const deleteProductHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const cleanId = id.replace(/\D/g, '');
    const result = await db.query(
      'DELETE FROM products WHERE product_id = $1 RETURNING *', 
      [cleanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found in database' });
    }
    
    res.json({ message: 'Product deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Detailed Error deleting product:', err.message);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
};

app.delete('/api/products/:id', verifyToken, deleteProductHandler);
app.delete('/api/admin/products/:id', verifyToken, deleteProductHandler);

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});