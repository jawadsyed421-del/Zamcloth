const nodemailer = require('nodemailer');
const Order = require('../models/Order.cjs');

// Order emails: an invoice to the customer and a "new order" alert to the owner.
// Settings (.env): SMTP_USER + SMTP_PASS (a Gmail App Password), OWNER_EMAIL, optional SMTP_HOST / SMTP_PORT / MAIL_FROM.
const COMPANY = {
    brand: 'ZAM',
    legalName: 'Zamcloth Pvt. Ltd.',
    tagline: 'Affordable Fashion. Premium Feel.',
    email: 'info@zamcloth.com',
    phone: '9372578357',
    address: 'F47 1st Floor D Wing, Elco Arcade 46 Hill Road, Bandra West, Mumbai, Maharashtra, India, 400050',
};

const configured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.MAIL_DRY_RUN === '1';

let transport;
const getTransport = () => {
    if (transport) return transport;
    transport = process.env.MAIL_DRY_RUN === '1'
        ? nodemailer.createTransport({ jsonTransport: true })
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: (Number(process.env.SMTP_PORT) || 465) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    return transport;
};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const orderNo = (order) => `ZAM-${String(order._id).slice(-6).toUpperCase()}`;

const itemsTable = (order) => `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
  <tr style="background:#f4f1e8"><th align="left" style="padding:8px">Item</th><th align="center" style="padding:8px">Qty</th><th align="right" style="padding:8px">Price</th><th align="right" style="padding:8px">Amount</th></tr>
  ${order.orderItems.map(i => `<tr>
    <td style="padding:8px;border-bottom:1px solid #eee">${esc(i.name)}<br><span style="color:#777;font-size:12px">${[i.size && `Size: ${esc(i.size)}`, i.color && `Colour: ${esc(i.color)}`].filter(Boolean).join(' · ')}</span></td>
    <td align="center" style="padding:8px;border-bottom:1px solid #eee">${i.quantity}</td>
    <td align="right" style="padding:8px;border-bottom:1px solid #eee">${money(i.price)}</td>
    <td align="right" style="padding:8px;border-bottom:1px solid #eee">${money(i.price * i.quantity)}</td></tr>`).join('')}
</table>`;

const totalsTable = (order, payment) => {
    const row = (label, value, bold) => `<tr><td style="padding:4px 8px;${bold ? 'font-weight:bold;font-size:16px' : ''}">${label}</td><td align="right" style="padding:4px 8px;${bold ? 'font-weight:bold;font-size:16px' : ''}">${value}</td></tr>`;
    const partial = order.paymentMethod === 'Partial COD';
    return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px">
      ${row('Subtotal', money(order.itemsPrice))}
      ${order.discountPrice > 0 ? row('Prepaid discount (5%)', `-${money(order.discountPrice)}`) : ''}
      ${row('Shipping', order.shippingPrice > 0 ? money(order.shippingPrice) : 'Free')}
      ${row('Order total', money(order.totalPrice), true)}
      ${row(partial ? 'Paid online now (advance)' : 'Paid online', money(payment?.amount ?? order.totalPrice))}
      ${partial ? row('To pay on delivery (cash)', money(order.codBalance), true) : ''}
    </table>`;
};

const paymentBlock = (payment) => `
<p style="font-size:14px;line-height:1.7;margin:0">
  <b>Payment ID:</b> ${esc(payment?.gatewayPaymentId || '—')}<br>
  <b>Reference ID:</b> ${esc(payment?.gatewayOrderId || '—')}<br>
  <b>Method:</b> ${esc(payment?.method || '—')} &nbsp;·&nbsp; <b>Gateway:</b> ${esc(payment?.gateway || 'Cashfree')}<br>
  <b>Paid on:</b> ${payment?.paidAt ? date(payment.paidAt) : '—'}
</p>`;

const addressBlock = (a) => `${esc(a.fullName)}<br>${esc(a.address)}<br>${esc(a.city)} ${esc(a.postalCode)}, ${esc(a.country || 'India')}<br>Phone: ${esc(a.phone)}<br>Email: ${esc(a.email)}`;

const shell = (title, body) => `<!doctype html><html><body style="margin:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#222">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-radius:6px;overflow:hidden">
<tr><td style="background:#111;color:#d4af37;padding:20px 24px;font-size:22px;letter-spacing:2px">ZAM CLOTH<br><span style="color:#ccc;font-size:12px;letter-spacing:0">${esc(COMPANY.tagline)}</span></td></tr>
<tr><td style="padding:24px"><h2 style="margin:0 0 16px;font-size:20px">${title}</h2>${body}</td></tr>
<tr><td style="background:#f4f1e8;padding:16px 24px;font-size:12px;color:#666;line-height:1.6">
${esc(COMPANY.legalName)} · ${esc(COMPANY.address)}<br>Support: ${esc(COMPANY.email)} · ${esc(COMPANY.phone)}</td></tr>
</table></td></tr></table></body></html>`;

// Invoice for the customer
const customerEmail = (order, payment) => {
    const a = order.shippingAddress;
    const body = `
<p style="font-size:15px;line-height:1.6">Hi ${esc(a.fullName)},<br>thank you for shopping with ZAM! Your payment was received and your order is confirmed. We will dispatch it soon and share tracking details when available.</p>
<p style="font-size:14px;margin:16px 0 4px"><b>Invoice no:</b> ${orderNo(order)} &nbsp;·&nbsp; <b>Date:</b> ${date(order.paidAt || order.createdAt)}</p>
${itemsTable(order)}
${totalsTable(order, payment)}
<h3 style="font-size:15px;margin:24px 0 6px">Payment</h3>${paymentBlock(payment)}
<h3 style="font-size:15px;margin:24px 0 6px">Delivering to</h3><p style="font-size:14px;line-height:1.7;margin:0">${addressBlock(a)}</p>
<p style="font-size:13px;color:#666;margin-top:24px">Need help? Reply to this email or write to ${esc(COMPANY.email)} with your invoice number. Exchanges and returns follow our policy on zamcloth.com.</p>`;
    return { subject: `Your ZAM order is confirmed – invoice ${orderNo(order)}`, html: shell('Order confirmed', body) };
};

// Alert for the owner, including the customer's purchase history
const ownerEmail = async (order, payment) => {
    const a = order.shippingAddress;
    const earlier = await Order.find({ user: order.user, isPaid: true, _id: { $ne: order._id } }).sort({ createdAt: -1 }).limit(5).lean();
    const allCount = await Order.countDocuments({ user: order.user, isPaid: true, _id: { $ne: order._id } });
    const spent = earlier.reduce((s, o) => s + o.totalPrice, 0);
    const history = allCount === 0
        ? '<p style="font-size:14px;margin:0">First order from this customer.</p>'
        : `<p style="font-size:14px;margin:0 0 6px">${allCount} earlier paid order${allCount > 1 ? 's' : ''}${allCount > earlier.length ? ` (last ${earlier.length} shown, ${money(spent)})` : ` totalling ${money(spent)}`}:</p>
           <ul style="font-size:13px;margin:0;padding-left:18px;line-height:1.7">${earlier.map(o => `<li>${date(o.createdAt)} · ZAM-${String(o._id).slice(-6).toUpperCase()} · ${money(o.totalPrice)} · ${o.orderItems.map(i => esc(i.name)).join(', ')} · ${esc(o.status.replace('_', ' '))}</li>`).join('')}</ul>`;
    const body = `
<p style="font-size:15px;line-height:1.6">A new order has been booked and paid. Please pack and dispatch it.</p>
<p style="font-size:14px;margin:0 0 4px"><b>Order:</b> ${orderNo(order)} &nbsp;·&nbsp; <b>Placed:</b> ${date(order.createdAt)} &nbsp;·&nbsp; <b>Type:</b> ${esc(order.paymentMethod)}</p>
<h3 style="font-size:15px;margin:20px 0 6px">Customer</h3><p style="font-size:14px;line-height:1.7;margin:0">${addressBlock(a)}</p>
<h3 style="font-size:15px;margin:20px 0 6px">Items</h3>${itemsTable(order)}${totalsTable(order, payment)}
<h3 style="font-size:15px;margin:20px 0 6px">Payment</h3>${paymentBlock(payment)}
<h3 style="font-size:15px;margin:20px 0 6px">Customer purchase history</h3>${history}`;
    return { subject: `New order ${orderNo(order)} – ${money(order.totalPrice)} from ${a.fullName}`, html: shell('New order booked', body) };
};

const send = async (to, mail) => {
    const info = await getTransport().sendMail({
        from: process.env.MAIL_FROM || `"ZAM Cloth" <${process.env.SMTP_USER || 'no-reply@zamcloth.com'}>`,
        to,
        replyTo: COMPANY.email,
        ...mail,
    });
    if (process.env.MAIL_DRY_RUN === '1') {
        // Test mode: nothing is sent; show who would have received what
        console.log(`MAIL_DRY_RUN to=${to} subject=${mail.subject}`);
        if (process.env.MAIL_DUMP_DIR) require('fs').writeFileSync(require('path').join(process.env.MAIL_DUMP_DIR, `${Date.now()}-${String(to).replace(/[^a-z0-9]/gi, '_')}.html`), mail.html);
    }
    return info;
};

// Sends both emails once per order. Safe to call many times: the first caller claims the order.
// Email problems never break the payment; they are logged and the claim is released so a later call can retry.
async function notifyOrderPaid(order, payment) {
    if (!configured()) { console.warn('Order emails skipped: SMTP_USER / SMTP_PASS not set'); return false; }
    const claimed = await Order.findOneAndUpdate({ _id: order._id, emailSentAt: { $exists: false } }, { emailSentAt: new Date() }, { new: true });
    if (!claimed) return false;
    try {
        const owner = process.env.OWNER_EMAIL || 'zamcloth5@gmail.com';
        const results = await Promise.allSettled([
            send(order.shippingAddress.email, customerEmail(claimed, payment)),
            ownerEmail(claimed, payment).then(m => send(owner, m)),
        ]);
        const failed = results.filter(r => r.status === 'rejected');
        failed.forEach(r => console.error('Order email failed:', r.reason?.message));
        if (failed.length === results.length) throw new Error('all emails failed');
        return true;
    } catch (error) {
        await Order.updateOne({ _id: order._id }, { $unset: { emailSentAt: 1 } });
        return false;
    }
}

module.exports = { notifyOrderPaid, customerEmail, ownerEmail, configured };
