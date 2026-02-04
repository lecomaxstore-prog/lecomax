const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const { EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("Missing EMAIL_USER or EMAIL_PASS in environment variables.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.post("/api/order", async (req, res) => {
  const order = req.body || {};
  if (!order.orderId || !order.customer || !Array.isArray(order.items)) {
    return res.status(400).json({ message: "Invalid order payload" });
  }

  const { orderId, date, customer, items, total } = order;
  const customerInfo = `
    <p><strong>Name:</strong> ${escapeHtml(customer.name)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(customer.phone)}</p>
    <p><strong>Address:</strong> ${escapeHtml(customer.address)}</p>
    <p><strong>City:</strong> ${escapeHtml(customer.city)}</p>
    <p><strong>Postal Code:</strong> ${escapeHtml(customer.postalCode)}</p>
  `;

  const itemsRows = items.map(item => {
    const subtotal = (Number(item.price) || 0) * (Number(item.qty) || 1);
    const meta = [item.color ? `Color: ${escapeHtml(item.color)}` : "", item.size ? `Size: ${escapeHtml(item.size)}` : ""]
      .filter(Boolean)
      .join(" • ");
    return `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${escapeHtml(item.title || item.id)}</td>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${meta || "-"}</td>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb; text-align:center;">${item.qty}</td>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb; text-align:right;">${item.price} MAD</td>
        <td style="padding:10px; border-bottom:1px solid #e5e7eb; text-align:right;">${subtotal} MAD</td>
      </tr>
    `;
  }).join("");

  const html = `
    <div style="font-family:Arial, sans-serif; color:#0f172a;">
      <h2>New Order: ${escapeHtml(orderId)}</h2>
      <p><strong>Date:</strong> ${escapeHtml(new Date(date || Date.now()).toLocaleString())}</p>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0;" />
      <h3>Customer Information</h3>
      ${customerInfo}
      <h3>Items</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding:10px; border-bottom:1px solid #e5e7eb;">Item</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid #e5e7eb;">Options</th>
            <th style="text-align:center; padding:10px; border-bottom:1px solid #e5e7eb;">Qty</th>
            <th style="text-align:right; padding:10px; border-bottom:1px solid #e5e7eb;">Price</th>
            <th style="text-align:right; padding:10px; border-bottom:1px solid #e5e7eb;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <h3 style="text-align:right; margin-top:16px;">Total: ${total} MAD</h3>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `Lecomax Orders <${EMAIL_USER}>`,
      to: "lecomaxstore@gmail.com",
      subject: `New Order ${orderId}`,
      html
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email send failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Order server running on port ${PORT}`);
});
