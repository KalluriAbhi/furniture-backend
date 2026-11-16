const nodemailer = require('nodemailer');

// Configure your email transporter 
// (For production, use SendGrid/Resend. For local testing, Gmail App Passwords work great)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g., your studio email
    pass: process.env.EMAIL_PASS  // e.g., Gmail App Password
  }
});

exports.sendOrderConfirmation = async (orderData) => {
  const { customer_name, customer_email, shipping_address, items, total_amount, order_id } = orderData;

  const itemsListHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #E5E0D8;">${item.name} (Qty: ${item.quantity})</td>
      <td style="padding: 8px; border-bottom: 1px solid #E5E0D8; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Artisan Studio" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: `Order Confirmation #${order_id || '1001'} — Artisan Studio`,
    html: `
      <div style="font-family: Georgia, serif; background-color: #FAF9F6; color: #2C2A29; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #E5E0D8;">
        <h2 style="text-align: center; letter-spacing: 2px; text-transform: uppercase; font-weight: 400; color: #2C2A29;">
          Artisan Studio
        </h2>
        <p style="text-align: center; font-size: 11px; letter-spacing: 2px; color: #7A7267; text-transform: uppercase; margin-bottom: 30px;">
          Handloom & Woodcraft Architecture
        </p>

        <p>Dear ${customer_name},</p>
        <p>Thank you for commissioning our handcrafted pieces. We have received your order and our artisans are preparing your selection with care.</p>

        <div style="background: #FFFFFF; padding: 20px; border: 1px solid #E5E0D8; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Order Summary #${order_id || '1001'}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${itemsListHtml}
            <tr>
              <td style="padding: 12px 8px; font-weight: bold;">Total Amount</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold;">₹${total_amount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <h4 style="font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 20px;">Shipping Destination:</h4>
        <p style="font-size: 14px; color: #7A7267; line-height: 1.5;">${shipping_address}</p>

        <hr style="border: none; border-top: 1px solid #E5E0D8; margin: 30px 0;" />
        
        <p style="text-align: center; font-size: 11px; color: #7A7267; letter-spacing: 1px;">
          If you have any questions regarding your bespoke order, reply directly to this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent successfully to ${customer_email}`);
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};