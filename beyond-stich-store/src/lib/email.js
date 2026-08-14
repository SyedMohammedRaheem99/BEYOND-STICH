import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || 'Beyond Stich <noreply@beyondstich.com>';

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order) {
  if (!resend) {
    console.log('[EMAIL] Resend not configured — skipping order confirmation for', order.orderNumber);
    return;
  }

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;">
          ${item.name} (${item.size}${item.color ? `, ${item.color}` : ''})
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;text-align:right;">
          ₹${(item.price * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;background:#0A0A0A;color:#F8F8F8;font-family:'Space Grotesk',Arial,sans-serif;">
      <div style="padding:32px;text-align:center;border-bottom:1px solid #2A2A2A;">
        <h1 style="font-size:28px;font-weight:900;letter-spacing:0.05em;margin:0;">BEYOND STICH</h1>
        <p style="color:#808080;font-size:12px;margin-top:4px;letter-spacing:0.1em;">WEAR THE THOUGHT</p>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:800;letter-spacing:0.05em;margin-bottom:8px;">ORDER CONFIRMED</h2>
        <p style="color:#A0A0A0;font-size:14px;margin-bottom:24px;">
          Thank you for your order! Here are your details.
        </p>
        <div style="background:#151515;border:1px solid #2A2A2A;border-radius:8px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;font-size:13px;">
            <tr>
              <td style="color:#808080;padding:4px 0;">Order Number</td>
              <td style="text-align:right;font-weight:700;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="color:#808080;padding:4px 0;">Date</td>
              <td style="text-align:right;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="color:#808080;padding:4px 0;">Total</td>
              <td style="text-align:right;font-weight:700;font-size:16px;">₹${order.total?.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
        <h3 style="font-size:11px;letter-spacing:0.15em;color:#808080;margin-bottom:12px;">ITEMS</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid #2A2A2A;">
              <th style="text-align:left;padding:8px 12px;color:#808080;font-size:10px;letter-spacing:0.1em;">ITEM</th>
              <th style="text-align:center;padding:8px 12px;color:#808080;font-size:10px;letter-spacing:0.1em;">QTY</th>
              <th style="text-align:right;padding:8px 12px;color:#808080;font-size:10px;letter-spacing:0.1em;">PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        ${order.shippingAddress ? `
        <div style="margin-top:24px;">
          <h3 style="font-size:11px;letter-spacing:0.15em;color:#808080;margin-bottom:8px;">SHIPPING TO</h3>
          <p style="font-size:13px;line-height:1.6;">
            ${order.shippingAddress.fullName}<br/>
            ${order.shippingAddress.street}<br/>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}
          </p>
        </div>
        ` : ''}
        <div style="margin-top:32px;text-align:center;">
          <p style="color:#808080;font-size:12px;">Estimated delivery: 3–6 business days</p>
        </div>
      </div>
      <div style="padding:24px;text-align:center;border-top:1px solid #2A2A2A;color:#808080;font-size:11px;">
        Beyond Stich · Wear the thought.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: order.email,
      subject: `Order Confirmed — ${order.orderNumber} | Beyond Stich`,
      html,
    });
  } catch (err) {
    console.error('[EMAIL] Failed to send order confirmation:', err);
  }
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdate(order) {
  if (!resend) {
    console.log('[EMAIL] Resend not configured — skipping shipping update for', order.orderNumber);
    return;
  }

  const html = `
    <div style="max-width:600px;margin:0 auto;background:#0A0A0A;color:#F8F8F8;font-family:'Space Grotesk',Arial,sans-serif;">
      <div style="padding:32px;text-align:center;border-bottom:1px solid #2A2A2A;">
        <h1 style="font-size:28px;font-weight:900;letter-spacing:0.05em;margin:0;">BEYOND STICH</h1>
        <p style="color:#808080;font-size:12px;margin-top:4px;letter-spacing:0.1em;">WEAR THE THOUGHT</p>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:800;letter-spacing:0.05em;margin-bottom:8px;">YOUR ORDER HAS SHIPPED!</h2>
        <p style="color:#A0A0A0;font-size:14px;margin-bottom:24px;">
          Great news — your order is on its way.
        </p>
        <div style="background:#151515;border:1px solid #2A2A2A;border-radius:8px;padding:20px;">
          <table style="width:100%;font-size:13px;">
            <tr>
              <td style="color:#808080;padding:6px 0;">Order Number</td>
              <td style="text-align:right;font-weight:700;">${order.orderNumber}</td>
            </tr>
            ${order.trackingNumber ? `
            <tr>
              <td style="color:#808080;padding:6px 0;">Tracking Number</td>
              <td style="text-align:right;font-weight:700;">${order.trackingNumber}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="color:#808080;padding:6px 0;">Status</td>
              <td style="text-align:right;color:#06B6D4;font-weight:700;">SHIPPED</td>
            </tr>
          </table>
        </div>
        <div style="margin-top:32px;text-align:center;">
          <p style="color:#808080;font-size:12px;">You can track your order anytime on our website.</p>
        </div>
      </div>
      <div style="padding:24px;text-align:center;border-top:1px solid #2A2A2A;color:#808080;font-size:11px;">
        Beyond Stich · Wear the thought.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: order.email,
      subject: `Your Order Has Shipped — ${order.orderNumber} | Beyond Stich`,
      html,
    });
  } catch (err) {
    console.error('[EMAIL] Failed to send shipping update:', err);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email, resetUrl) {
  if (!resend) {
    console.log('[EMAIL] Resend not configured — reset link:', resetUrl);
    return;
  }

  const html = `
    <div style="max-width:600px;margin:0 auto;background:#0A0A0A;color:#F8F8F8;font-family:'Space Grotesk',Arial,sans-serif;">
      <div style="padding:32px;text-align:center;border-bottom:1px solid #2A2A2A;">
        <h1 style="font-size:28px;font-weight:900;letter-spacing:0.05em;margin:0;">BEYOND STICH</h1>
        <p style="color:#808080;font-size:12px;margin-top:4px;letter-spacing:0.1em;">WEAR THE THOUGHT</p>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:800;letter-spacing:0.05em;margin-bottom:8px;">RESET YOUR PASSWORD</h2>
        <p style="color:#A0A0A0;font-size:14px;margin-bottom:24px;">
          We received a request to reset your password. Click the button below to set a new one.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#F8F8F8;color:#0A0A0A;font-weight:800;font-size:13px;letter-spacing:0.08em;text-decoration:none;border-radius:50px;">
            RESET PASSWORD
          </a>
        </div>
        <p style="color:#808080;font-size:12px;text-align:center;">
          This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this email.
        </p>
      </div>
      <div style="padding:24px;text-align:center;border-top:1px solid #2A2A2A;color:#808080;font-size:11px;">
        Beyond Stich · Wear the thought.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Reset Your Password | Beyond Stich',
      html,
    });
  } catch (err) {
    console.error('[EMAIL] Failed to send password reset:', err);
  }
}

/**
 * Send refund confirmation email
 */
export async function sendRefundEmail(order) {
  if (!resend || !order.email) {
    console.log('[EMAIL] Skipping refund email for', order.orderNumber);
    return;
  }

  const html = `
    <div style="max-width:600px;margin:0 auto;background:#0A0A0A;color:#F8F8F8;font-family:'Space Grotesk',Arial,sans-serif;">
      <div style="padding:32px;text-align:center;border-bottom:1px solid #2A2A2A;">
        <h1 style="font-size:28px;font-weight:900;letter-spacing:0.05em;margin:0;">BEYOND STICH</h1>
        <p style="color:#808080;font-size:12px;margin-top:4px;letter-spacing:0.1em;">WEAR THE THOUGHT</p>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:800;letter-spacing:0.05em;margin-bottom:8px;">REFUND PROCESSED</h2>
        <p style="color:#A0A0A0;font-size:14px;margin-bottom:24px;">
          Your refund has been processed. Here are the details.
        </p>
        <div style="background:#151515;border:1px solid #2A2A2A;border-radius:8px;padding:20px;">
          <table style="width:100%;font-size:13px;">
            <tr>
              <td style="color:#808080;padding:6px 0;">Order Number</td>
              <td style="text-align:right;font-weight:700;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="color:#808080;padding:6px 0;">Refund Amount</td>
              <td style="text-align:right;font-weight:700;color:#22C55E;">₹${(order.refundAmount || order.total)?.toLocaleString('en-IN')}</td>
            </tr>
            ${order.refundReason ? `
            <tr>
              <td style="color:#808080;padding:6px 0;">Reason</td>
              <td style="text-align:right;">${order.refundReason}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        <div style="margin-top:24px;text-align:center;">
          <p style="color:#808080;font-size:12px;">The refund will be credited to your original payment method within 5-7 business days.</p>
        </div>
      </div>
      <div style="padding:24px;text-align:center;border-top:1px solid #2A2A2A;color:#808080;font-size:11px;">
        Beyond Stich · Wear the thought.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: order.email,
      subject: `Refund Processed — ${order.orderNumber} | Beyond Stich`,
      html,
    });
  } catch (err) {
    console.error('[EMAIL] Failed to send refund email:', err);
  }
}
