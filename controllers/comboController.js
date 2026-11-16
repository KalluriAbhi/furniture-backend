const db = require('../config/db');

exports.getComboDetails = async (req, res) => {
  const { comboId } = req.params;
  try {
    const comboRes = await db.query('SELECT * FROM combos WHERE combo_id = $1', [comboId]);
    if (comboRes.rows.length === 0) {
      return res.status(404).json({ error: 'Combo not found' });
    }

    const itemsRes = await db.query(`
      SELECT 
        ci.combo_item_id,
        ci.slot_category_id,
        c.name AS slot_category_name,
        ci.default_product_id,
        p.name AS default_product_name,
        p.base_price AS default_product_price,
        p.images AS default_product_images
      FROM combo_items ci
      JOIN categories c ON ci.slot_category_id = c.category_id
      JOIN products p ON ci.default_product_id = p.product_id
      WHERE ci.combo_id = $1
    `, [comboId]);

    const itemsWithSwaps = await Promise.all(itemsRes.rows.map(async (item) => {
      const swaps = await db.query(
        'SELECT product_id, name, base_price, images FROM products WHERE category_id = $1 AND is_active = true',
        [item.slot_category_id]
      );
      return {
        ...item,
        available_replacements: swaps.rows
      };
    }));

    res.json({
      combo: comboRes.rows[0],
      items: itemsWithSwaps
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching combo' });
  }
};


// Get all products for Admin Inventory
exports.getAllProducts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY product_id ASC;');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

// Update product stock and price
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, sku, base_price, stock_quantity } = req.body;

  try {
    const query = `
      UPDATE products 
      SET name = $1, sku = $2, base_price = $3, stock_quantity = $4
      WHERE product_id = $5
      RETURNING *;
    `;
    const values = [name, sku, base_price, stock_quantity, id];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product updated successfully!', product: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { order_status } = req.body;

  try {
    const query = `
      UPDATE orders 
      SET order_status = $1 
      WHERE order_id = $2 
      RETURNING *;
    `;
    const result = await db.query(query, [order_status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ message: 'Order status updated successfully!', order: result.rows[0] });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

