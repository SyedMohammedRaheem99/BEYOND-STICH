import { sendMail, mailerConfigured } from '@/lib/mailer';

// Templates live here; delivery lives in lib/mailer.js. The split matters
// because every function below used to begin by checking a provider SDK
// handle — so swapping transports meant editing five call sites and their
// five different "not configured" branches.
//
// `From`, headers, the plain-text alternative and delivery logging are all
// handled by sendMail(). These functions only build HTML.

// Used to build links in emails. Prefer the public site URL; NEXTAUTH_URL is
// the next best thing since it is already set wherever auth works.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://beyondstich.com';

// Images in email must be absolute and publicly reachable — a relative path
// or a localhost URL renders as a broken icon in the recipient's client.
// During local development the logo therefore won't appear; that is expected
// and resolves itself once NEXT_PUBLIC_SITE_URL points at the live domain.
const LOGO_URL = `${SITE_URL}/logos/wordmark.png`;
const LOGO_URL_2X = `${SITE_URL}/logos/wordmark@2x.png`;

// Palette mirrors globals.css. Email clients strip <style> blocks and have no
// CSS-variable support, so every value has to be inlined literally — these
// constants are what keep the six templates from drifting apart.
const C = {
  bg: '#0A0A0A',
  card: '#151515',
  border: '#2A2A2A',
  text: '#F8F8F8',
  muted: '#A0A0A0',
  dim: '#8A8A8A',
  accent: '#F5C518',
  accentInk: '#0A0A0A',
  success: '#22C55E',
  info: '#06B6D4',
};

const FONT = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const DISPLAY = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

/**
 * Masthead.
 *
 * The wordmark image sits ABOVE a text version of the same name, and the
 * text is never hidden. Most clients block remote images until the reader
 * allows them — Outlook by default — so a logo-only header would leave a
 * blank box where the brand should be. With both, images-off still reads
 * "BEYOND STICH".
 */
function header() {
  return `
    <tr>
      <td align="center" style="padding:32px 24px 24px;border-bottom:1px solid ${C.border};">
        <img src="${LOGO_URL}" srcset="${LOGO_URL} 1x, ${LOGO_URL_2X} 2x"
             width="170" alt="Beyond Stich"
             style="display:block;width:170px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto 10px;" />
        <div style="font-family:${DISPLAY};font-size:11px;font-weight:700;letter-spacing:0.22em;color:${C.dim};text-transform:uppercase;">
          Wear the thought
        </div>
      </td>
    </tr>`;
}

function footer(extra = '') {
  return `
    <tr>
      <td align="center" style="padding:24px;border-top:1px solid ${C.border};">
        <div style="font-family:${FONT};font-size:12px;color:${C.dim};line-height:1.7;">
          ${extra ? `${extra}<br/><br/>` : ''}
          Questions? Just reply to this email — a human reads it.<br/>
          <a href="${SITE_URL}" style="color:${C.accent};text-decoration:none;font-weight:600;">beyondstich.com</a>
          &nbsp;·&nbsp; Bangalore, India
        </div>
      </td>
    </tr>`;
}

/**
 * Outer shell.
 *
 * Tables, not divs: Outlook's rendering engine is Microsoft Word, which has
 * no meaningful support for modern CSS layout. The nested-table pattern is
 * ugly but it is the only structure that renders identically everywhere.
 */
function shell(innerHtml, preheader = '') {
  return `
<div style="background:${C.bg};margin:0;padding:0;width:100%;">
  ${preheader ? `
  <!-- Inbox preview text. Hidden in the body, but it is what the reader sees
       beside the subject line, so leaving it empty shows raw markup instead. -->
  <div style="display:none;font-size:1px;color:${C.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}
  </div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bg};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
               style="width:100%;max-width:600px;background:${C.bg};border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
          ${innerHtml}
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

/** Primary call to action. Padded <a>, since many clients drop button CSS. */
function button(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="background:${C.accent};border-radius:6px;">
          <a href="${href}"
             style="display:inline-block;padding:14px 30px;font-family:${DISPLAY};font-size:15px;font-weight:800;letter-spacing:0.1em;color:${C.accentInk};text-decoration:none;text-transform:uppercase;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Section heading, consistent across templates. */
function h2(text, color = C.text) {
  return `<h2 style="margin:0 0 8px;font-family:${DISPLAY};font-size:26px;font-weight:800;letter-spacing:0.04em;color:${color};text-transform:uppercase;">${text}</h2>`;
}

function lead(text) {
  return `<p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.muted};">${text}</p>`;
}

/** Small uppercase label above a block of detail. */
function label(text) {
  return `<div style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.18em;color:${C.dim};text-transform:uppercase;margin:0 0 10px;">${text}</div>`;
}

/**
 * Order confirmation — sent to the customer the moment an order is created,
 * on every payment path (COD, online-via-browser, online-via-webhook).
 */
export async function sendOrderConfirmation(order) {
  if (!order?.email) return { ok: false, error: 'no recipient' };

  const isCod = order.paymentMethod === 'cod';
  const addr = order.shippingAddress || {};
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const firstName = String(addr.fullName || '').split(' ')[0];

  const itemsHtml = (order.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:14px;color:${C.text};">
          ${i.name}
          <div style="font-size:12px;color:${C.dim};margin-top:3px;">
            Size ${i.size}${i.color ? ` &middot; ${i.color}` : ''} &middot; Qty ${i.quantity}
          </div>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:14px;font-weight:700;color:${C.text};white-space:nowrap;">
          ${money(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join('');

  // Rows are built by a helper so a zero discount can be omitted entirely —
  // a "₹0 off" line is noise on a receipt.
  const totalRow = (name, value, opts = {}) => `
      <tr>
        <td style="padding:5px 0;font-family:${FONT};font-size:${opts.big ? '15px' : '13px'};color:${opts.big ? C.text : C.muted};${opts.big ? 'font-weight:700;' : ''}">${name}</td>
        <td align="right" style="padding:5px 0;font-family:${FONT};font-size:${opts.big ? '18px' : '13px'};font-weight:700;color:${opts.color || C.text};white-space:nowrap;">${value}</td>
      </tr>`;

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('Order confirmed')}
        ${lead(`Thanks${firstName ? `, ${firstName}` : ''} &mdash; we have your order and we are packing it now.`)}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:${C.card};border:1px solid ${C.border};border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:${FONT};font-size:12px;color:${C.dim};">Order number</td>
                  <td align="right" style="font-family:${DISPLAY};font-size:17px;font-weight:800;letter-spacing:0.05em;color:${C.accent};">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding-top:8px;font-family:${FONT};font-size:12px;color:${C.dim};">Placed on</td>
                  <td align="right" style="padding-top:8px;font-family:${FONT};font-size:13px;color:${C.text};">
                    ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px;font-family:${FONT};font-size:12px;color:${C.dim};">Payment</td>
                  <td align="right" style="padding-top:8px;font-family:${FONT};font-size:13px;font-weight:700;color:${isCod ? C.accent : C.success};">
                    ${isCod ? 'Cash on delivery' : 'Paid online'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${label('Your order')}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
          ${itemsHtml}
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
          ${totalRow('Subtotal', money(order.subtotal))}
          ${order.discount > 0 ? totalRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `&minus; ${money(order.discount)}`, { color: C.success }) : ''}
          ${totalRow('Shipping', order.shipping > 0 ? money(order.shipping) : 'FREE', { color: order.shipping > 0 ? C.text : C.success })}
          <tr><td colspan="2" style="padding:8px 0 0;border-top:1px solid ${C.border};"></td></tr>
          ${totalRow(isCod ? 'To pay on delivery' : 'Total paid', money(order.total), { big: true, color: C.accent })}
        </table>

        ${isCod ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:rgba(245,197,24,0.08);border:1px solid rgba(245,197,24,0.3);border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:14px 18px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.text};">
              <strong style="color:${C.accent};">Keep ${money(order.total)} ready.</strong>
              Please have the exact amount for the delivery partner.
            </td>
          </tr>
        </table>` : ''}

        ${addr.fullName ? `
        ${label('Delivering to')}
        <p style="margin:0 0 28px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.muted};">
          <span style="color:${C.text};font-weight:600;">${addr.fullName}</span><br/>
          ${addr.street || ''}<br/>
          ${addr.city || ''}${addr.state ? `, ${addr.state}` : ''} &mdash; ${addr.pincode || ''}<br/>
          ${addr.phone ? `<span style="color:${C.dim};">${addr.phone}</span>` : ''}
        </p>` : ''}

        ${button(`${SITE_URL}/track?order=${encodeURIComponent(order.orderNumber)}`, 'Track your order')}

        <p style="margin:20px 0 0;text-align:center;font-family:${FONT};font-size:12px;color:${C.dim};">
          Estimated delivery: 3&ndash;6 business days
        </p>
      </td>
    </tr>
    ${footer('Need to change something? Reply within 24 hours and we will sort it.')}
  `,
    `Order ${order.orderNumber} confirmed — ${money(order.total)}`
  );

  return sendMail({
    to: order.email,
    subject: `Order Confirmed — ${order.orderNumber} | Beyond Stich`,
    html,
    type: 'order-confirmation',
  });
}

/**
 * Shipping update — sent when the admin marks an order 'shipped'.
 */
export async function sendShippingUpdate(order) {
  if (!order?.email) return { ok: false, error: 'no recipient' };

  const addr = order.shippingAddress || {};
  const firstName = String(addr.fullName || '').split(' ')[0];

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('On its way')}
        ${lead(`Good news${firstName ? `, ${firstName}` : ''} &mdash; your order has left our studio and is heading to you.`)}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:${C.card};border:1px solid ${C.border};border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:${FONT};font-size:12px;color:${C.dim};">Order number</td>
                  <td align="right" style="font-family:${DISPLAY};font-size:17px;font-weight:800;letter-spacing:0.05em;color:${C.accent};">${order.orderNumber}</td>
                </tr>
                ${order.trackingNumber ? `
                <tr>
                  <td style="padding-top:8px;font-family:${FONT};font-size:12px;color:${C.dim};">Tracking number</td>
                  <td align="right" style="padding-top:8px;font-family:${FONT};font-size:14px;font-weight:700;color:${C.text};">${order.trackingNumber}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding-top:8px;font-family:${FONT};font-size:12px;color:${C.dim};">Status</td>
                  <td align="right" style="padding-top:8px;font-family:${FONT};font-size:13px;font-weight:700;color:${C.info};">SHIPPED</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${addr.city ? `
        ${label('Heading to')}
        <p style="margin:0 0 28px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.muted};">
          ${addr.city}${addr.state ? `, ${addr.state}` : ''} &mdash; ${addr.pincode || ''}
        </p>` : ''}

        ${button(`${SITE_URL}/track?order=${encodeURIComponent(order.orderNumber)}`, 'Track your order')}

        <p style="margin:20px 0 0;text-align:center;font-family:${FONT};font-size:12px;color:${C.dim};">
          Most orders arrive within 3&ndash;6 business days.
        </p>
      </td>
    </tr>
    ${footer()}
  `,
    `${order.orderNumber} has shipped${order.trackingNumber ? ` — tracking ${order.trackingNumber}` : ''}`
  );

  return sendMail({
    to: order.email,
    subject: `Your Order Has Shipped — ${order.orderNumber} | Beyond Stich`,
    html,
    type: 'shipping-update',
  });
}

/**
 * Password reset link.
 */
export async function sendPasswordReset(email, resetUrl) {
  // Without a transport the link is logged rather than lost, so a developer
  // can still complete a reset locally.
  if (!mailerConfigured()) {
    console.warn('[mail] SMTP not configured — reset link:', resetUrl);
  }

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('Reset your password')}
        ${lead('We received a request to reset your password. Choose a new one using the button below.')}

        ${button(resetUrl, 'Reset password')}

        <p style="margin:28px 0 0;text-align:center;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.dim};">
          This link expires in 1 hour and can be used once.<br/>
          If you did not request this, you can safely ignore this email &mdash;
          your password stays as it is.
        </p>

        <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${C.border};font-family:${FONT};font-size:11px;line-height:1.6;color:${C.dim};word-break:break-all;">
          Button not working? Paste this into your browser:<br/>
          <span style="color:${C.muted};">${resetUrl}</span>
        </p>
      </td>
    </tr>
    ${footer()}
  `,
    'Reset your Beyond Stich password — link expires in 1 hour'
  );

  return sendMail({
    to: email,
    subject: 'Reset Your Password | Beyond Stich',
    html,
    type: 'password-reset',
    // A reset link is security-sensitive: no pixel, so nothing about when or
    // whether it was read is recorded beyond the send itself.
    track: false,
  });
}

/**
 * Refund confirmation — sent when the admin marks a refund 'processed'.
 */
export async function sendRefundEmail(order) {
  if (!order?.email) return { ok: false, error: 'no recipient' };

  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('Refund processed')}
        ${lead('Your refund is on its way back to you.')}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:${C.card};border:1px solid ${C.border};border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:${FONT};font-size:12px;color:${C.dim};">Order number</td>
                  <td align="right" style="font-family:${DISPLAY};font-size:17px;font-weight:800;letter-spacing:0.05em;color:${C.accent};">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding-top:10px;font-family:${FONT};font-size:13px;font-weight:700;color:${C.text};">Refund amount</td>
                  <td align="right" style="padding-top:10px;font-family:${FONT};font-size:18px;font-weight:700;color:${C.success};">
                    ${money(order.refundAmount || order.total)}
                  </td>
                </tr>
                ${order.refundReason ? `
                <tr>
                  <td colspan="2" style="padding-top:10px;font-family:${FONT};font-size:12px;color:${C.dim};line-height:1.6;">
                    Reason: ${order.refundReason}
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.7;color:${C.muted};">
          Refunds usually reach your account in
          <strong style="color:${C.text};">5&ndash;7 business days</strong>, depending on
          your bank. For cash-on-delivery orders we will be in touch about the
          transfer.
        </p>
      </td>
    </tr>
    ${footer()}
  `,
    `Refund of ${money(order.refundAmount || order.total)} processed for ${order.orderNumber}`
  );

  return sendMail({
    to: order.email,
    subject: `Refund Processed — ${order.orderNumber} | Beyond Stich`,
    html,
    type: 'refund',
  });
}

/**
 * Alert the shop owner that an order came in.
 *
 * Without this the only way to learn about an order is to open the admin
 * panel and look, which is no use against a 24-hour dispatch promise.
 *
 * Sends to ADMIN_ALERT_EMAIL; skipped entirely when that isn't set.
 */
export async function sendNewOrderAlert(order) {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) {
    console.warn('[mail] ADMIN_ALERT_EMAIL not set — no alert for', order.orderNumber);
    return { ok: false, error: 'ADMIN_ALERT_EMAIL not set' };
  }

  const addr = order.shippingAddress || {};
  const isCod = order.paymentMethod === 'cod';
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const itemsHtml = (order.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:13px;color:${C.text};">
          ${i.name}
          <span style="color:${C.dim};">&mdash; ${i.size}${i.color ? `/${i.color}` : ''} &times; ${i.quantity}</span>
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:13px;font-weight:700;color:${C.text};white-space:nowrap;">
          ${money(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join('');

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:28px;">
        ${h2(`New ${isCod ? 'COD ' : ''}order`, C.accent)}
        <p style="margin:0 0 24px;font-family:${DISPLAY};font-size:20px;font-weight:800;letter-spacing:0.05em;color:${C.text};">
          ${order.orderNumber}
          <span style="font-family:${FONT};font-size:14px;font-weight:600;color:${isCod ? C.accent : C.success};">
            &middot; ${isCod ? `collect ${money(order.total)}` : `${money(order.total)} paid`}
          </span>
        </p>

        ${label('Items to pack')}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
          ${itemsHtml}
        </table>

        ${label('Deliver to')}
        <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.muted};">
          <span style="color:${C.text};font-weight:600;">${addr.fullName || '—'}</span><br/>
          ${addr.street || ''}<br/>
          ${addr.city || ''}${addr.state ? `, ${addr.state}` : ''} &mdash; ${addr.pincode || ''}<br/>
          ${addr.phone ? `<a href="tel:${addr.phone}" style="color:${C.success};text-decoration:none;font-weight:600;">${addr.phone}</a>` : 'no phone'}
          ${order.email ? ` &middot; <span style="color:${C.dim};">${order.email}</span>` : ''}
        </p>

        ${button(`${SITE_URL}/track?order=${encodeURIComponent(order.orderNumber)}`, 'View order')}
      </td>
    </tr>
    ${footer()}
  `,
    `${isCod ? 'COD' : 'Paid'} · ${money(order.total)} · ${addr.city || ''}`
  );

  return sendMail({
    to,
    subject: `New ${isCod ? 'COD ' : ''}order ${order.orderNumber} — ${money(order.total)}`,
    html,
    type: 'admin-alert',
    track: false,
  });
}

/**
 * Send the 6-digit signup verification code.
 *
 * The code is shown as text rather than a link because most signups happen
 * on a phone, where a link means leaving the browser for the mail app and
 * finding the way back. A code can be read and typed without losing the page.
 */
export async function sendVerificationOtp(email, code, name = '') {
  const firstName = String(name || '').split(' ')[0];

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('Confirm your email')}
        ${lead(`${firstName ? `Hi ${firstName}, enter` : 'Enter'} this code to finish setting up your account.`)}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px;">
          <tr>
            <td align="center" style="background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:20px 34px;">
              <div style="font-family:${DISPLAY};font-size:40px;font-weight:900;letter-spacing:0.28em;color:${C.accent};line-height:1;">
                ${code}
              </div>
            </td>
          </tr>
        </table>

        <p style="margin:0;text-align:center;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.dim};">
          This code expires in 15 minutes.<br/>
          If you did not create a Beyond Stich account, you can safely ignore
          this email &mdash; nothing will happen.
        </p>
      </td>
    </tr>
    ${footer()}
  `,
    `${code} — your Beyond Stich verification code`
  );

  // The derived text part would render the code inside a wall of markup;
  // spelling it out keeps it readable in clients that show text only.
  const text = [
    'BEYOND STICH — CONFIRM YOUR EMAIL',
    '',
    `${firstName ? `Hi ${firstName}, enter` : 'Enter'} this code to finish setting up your account:`,
    '',
    `    ${code}`,
    '',
    'This code expires in 15 minutes. If you did not create an account with',
    'Beyond Stich, you can safely ignore this email.',
  ].join('\n');

  return sendMail({
    to: email,
    subject: `${code} is your Beyond Stich verification code`,
    html,
    text,
    type: 'otp',
    // A verification code is a credential — no pixel on it.
    track: false,
  });
}
