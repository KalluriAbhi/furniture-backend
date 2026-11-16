const axios = require('axios');

async function sendOrderNotification(customerPhone, customerName, orderId, totalAmount) {
  // If Meta WhatsApp credentials aren't set yet, simulate it locally in the console
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log('\n----------------------------------------');
    console.log(`[WHATSAPP SIMULATION API TRIGGERED]`);
    console.log(`To: ${customerPhone}`);
    console.log(`Message: "Hello ${customerName}, thank you for your order #${orderId} with our store! Your order total is ₹${totalAmount.toLocaleString()}. We will notify you when it ships."`);
    console.log('----------------------------------------\n');
    return { success: true, simulated: true };
  }

  try {
    // Production Meta Cloud API Payload
    const url = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: customerPhone,
      type: 'template',
      template: {
        name: 'order_confirmation', // Template name approved in Meta Business Manager
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: orderId.toString() },
              { type: 'text', text: totalAmount.toString() }
            ]
          }
        ]
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOrderNotification };