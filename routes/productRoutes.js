const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.delete('/:id', productController.deleteProduct);

app.post('/api/admin/products', async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      sub_category,
      base_price,
      original_price,
      stock_quantity,
      is_new_arrival,
      material,
      craft_origin,
      care_instructions,
      image_url,
      video_url
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products (
        name, sku, category, sub_category, base_price, original_price,
        stock_quantity, is_new_arrival, material, craft_origin,
        care_instructions, image_url, video_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name,
        sku || `SKU-${Date.now()}`,
        category || 'Bedsheets',
        sub_category || null,
        Number(base_price),
        original_price ? Number(original_price) : null,
        Number(stock_quantity ?? 10),
        Boolean(is_new_arrival),
        material || null,
        craft_origin || null,
        care_instructions || null,
        image_url || null,
        video_url || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

routes.exports = router; // or module.exports = router;