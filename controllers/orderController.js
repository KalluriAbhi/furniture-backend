const db = require('../config/db');
const { calculateDistanceKm, evaluateDelivery } = require('../services/geoDistanceService');
const { sendOrderNotification } = require('../services/whatsappService');

// 1. Calculate Delivery Fee Endpoint
exports.calculateDeliveryFee = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and Longitude are required.' });
  }

  try {
    const distanceKm = calculateDistanceKm(parseFloat(latitude), parseFloat(longitude));
    const deliveryResult = evaluateDelivery(distanceKm);

    res.json({
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      ...deliveryResult
    });
  } catch (err) {
    console.error('Delivery calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate delivery fee.' });
  }
};

// 2. Create Order & Trigger WhatsApp Notification Endpoint
exports.createOrder = async (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    shipping_address,
    pincode,
    latitude,
    longitude,
    items, // array of products/combos
    subtotal
  } = req.body;

  try {
    // Calculate delivery distance and charges
    const distanceKm = calculateDistanceKm(parseFloat(latitude), parseFloat(longitude));
    const deliveryEval = evaluateDelivery(distanceKm);

    const total_amount = subtotal + deliveryEval.charge;
    const orderStatus = deliveryEval.requiresQuotation ? 'pending_quotation' : 'confirmed';

    // Insert order into PostgreSQL
    const orderQuery = `
      INSERT INTO orders (
        customer_name, customer_phone, customer_email, shipping_address, 
        pincode, latitude, longitude, distance_km, delivery_type, 
        delivery_charges, subtotal, total_amount, order_status, whatsapp_notified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      RETURNING *;
    `;

    const orderValues = [
      customer_name, customer_phone, customer_email, shipping_address,
      pincode, latitude, longitude, distanceKm, deliveryEval.type,
      deliveryEval.charge, subtotal, total_amount, orderStatus
    ];

    const newOrderRes = await db.query(orderQuery, orderValues);
    const createdOrder = newOrderRes.rows[0];

    // Trigger Automated WhatsApp Notification
    await sendOrderNotification(
      createdOrder.customer_phone,
      createdOrder.customer_name,
      createdOrder.order_id,
      createdOrder.total_amount
    );

    res.status(201).json({
      message: 'Order placed successfully and WhatsApp notification triggered!',
      order: createdOrder
    });

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
};

// Get all orders for Admin Dashboard
exports.getAllOrders = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders ORDER BY order_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const emailService = require('../services/emailService');

// Inside your createOrder / checkout function:
exports.createOrder = async (req, res) => {
  const { customer_name, customer_email, shipping_address, items, total_amount } = req.body;

  try {
    // 1. Save order to PostgreSQL database (your existing logic)
    const newOrderQuery = await db.query(
      `INSERT INTO orders (customer_name, customer_email, shipping_address, total_amount, status) 
       VALUES ($1, $2, $3, $4, 'Pending') RETURNING order_id`,
      [customer_name, customer_email, shipping_address, total_amount]
    );
    const orderId = newOrderQuery.rows[0].order_id;

    // 2. Send automated Nicobar-styled confirmation email asynchronously
    emailService.sendOrderConfirmation({
      order_id: orderId,
      customer_name,
      customer_email,
      shipping_address,
      items,
      total_amount
    }).catch(err => console.error('Background email dispatch failed:', err));

    res.status(201).json({ message: 'Order placed successfully!', orderId });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Server error processing order.' });
  }
};