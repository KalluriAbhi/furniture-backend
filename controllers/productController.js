const pool = require('../config/db');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  const { name, base_price, craft_origin, material, care_instructions, stock_quantity, image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, base_price, craft_origin, material, care_instructions, stock_quantity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, base_price, craft_origin, material, care_instructions, stock_quantity || 0, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Server error while creating product' });
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE product_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Server error while deleting product' });
  }
};