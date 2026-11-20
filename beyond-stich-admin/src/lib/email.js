import { sendMail } from '@/lib/mailer';

// Templates only — delivery, headers and the plain-text alternative live in
// lib/mailer.js.
//
// These mirror the storefront's lib/email.js byte for byte in look: the
// customer sees one brand, and a shipping email that looks different from
// the order confirmation reads as a phishing attempt.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.STORE_URL ||
  'https://beyondstich.com';

const LOGO_URL = `${SITE_URL}/logos/wordmark.png`;
const LOGO_URL_2X = `${SITE_URL}/logos/wordmark@2x.png`;

// Email clients strip <style> blocks and have no CSS-variable support, so
// every value is inlined. Mirrors globals.css.
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
  error: '#EF4444',
};

const FONT = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const DISPLAY = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Masthead. The wordmark image sits above a text version of the same name,
 * and the text is never hidden — most clients block remote images by
 * default, so a logo-only header would leave a blank box where the brand
 * should be.
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

/** Tables, not divs: Outlook renders with Microsoft Word's engine. */
function shell(innerHtml, preheader = '') {
  return `
<div style="background:${C.bg};margin:0;padding:0;width:100%;">
  ${preheader ? `
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

function button(href, text) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="background:${C.accent};border-radius:6px;">
          <a href="${href}"
             style="display:inline-block;padding:14px 30px;font-family:${DISPLAY};font-size:15px;font-weight:800;letter-spacing:0.1em;color:${C.accentInk};text-decoration:none;text-transform:uppercase;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function h2(text, color = C.text) {
  return `<h2 style="margin:0 0 8px;font-family:${DISPLAY};font-size:26px;font-weight:800;letter-spacing:0.04em;color:${color};text-transform:uppercase;">${text}</h2>`;
}

function lead(text) {
  return `<p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.muted};">${text}</p>`;
}

function label(text) {
  return `<div style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.18em;color:${C.dim};text-transform:uppercase;margin:0 0 10px;">${text}</div>`;
}

/** Shared order-number + status card. */
function orderCard(rows) {
  return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:${C.card};border:1px solid ${C.border};border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${rows}
              </table>
            </td>
          </tr>
        </table>`;
}

function cardRow(name, value, opts = {}) {
  return `
                <tr>
                  <td style="${opts.first ? '' : 'padding-top:8px;'}font-family:${FONT};font-size:12px;color:${C.dim};">${name}</td>
                  <td align="right" style="${opts.first ? '' : 'padding-top:8px;'}font-family:${opts.display ? DISPLAY : FONT};font-size:${opts.display ? '17px' : '13px'};font-weight:${opts.display ? '800' : '700'};${opts.display ? 'letter-spacing:0.05em;' : ''}color:${opts.color || C.text};">${value}</td>
                </tr>`;
}

/**
 * Shipping notification — sent when the admin marks an order 'shipped'.
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

        ${orderCard(`
          ${cardRow('Order number', order.orderNumber, { first: true, display: true, color: C.accent })}
          ${order.trackingNumber ? cardRow('Tracking number', order.trackingNumber) : ''}
          ${cardRow('Status', 'SHIPPED', { color: C.info })}
        `)}

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
  });
}

/**
 * Refund confirmation — sent when a refund is marked 'processed'.
 */
export async function sendRefundEmail(order) {
  if (!order?.email) return { ok: false, error: 'no recipient' };

  const amount = order.refundAmount || order.total;

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('Refund processed')}
        ${lead('Your refund is on its way back to you.')}

        ${orderCard(`
          ${cardRow('Order number', order.orderNumber, { first: true, display: true, color: C.accent })}
          <tr>
            <td style="padding-top:10px;font-family:${FONT};font-size:13px;font-weight:700;color:${C.text};">Refund amount</td>
            <td align="right" style="padding-top:10px;font-family:${FONT};font-size:18px;font-weight:700;color:${C.success};">${money(amount)}</td>
          </tr>
          ${order.refundReason ? `
          <tr>
            <td colspan="2" style="padding-top:10px;font-family:${FONT};font-size:12px;color:${C.dim};line-height:1.6;">
              Reason: ${order.refundReason}
            </td>
          </tr>` : ''}
        `)}

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
    `Refund of ${money(amount)} processed for ${order.orderNumber}`
  );

  return sendMail({
    to: order.email,
    subject: `Refund Processed — ${order.orderNumber} | Beyond Stich`,
    html,
  });
}

/**
 * Cancellation notice.
 *
 * Cancelling used to be silent: the order simply disappeared from the
 * customer's account with no explanation, which produces a support message
 * every single time — and on a prepaid order, a worried one.
 */
export async function sendOrderCancelled(order) {
  if (!order?.email) return { ok: false, error: 'no recipient' };

  const addr = order.shippingAddress || {};
  const firstName = String(addr.fullName || '').split(' ')[0];
  const wasPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'refunded';

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2('Order cancelled')}
        ${lead(`${firstName ? `Hi ${firstName} &mdash; ` : ''}your order has been cancelled. Nothing will be shipped and nothing further is owed.`)}

        ${orderCard(`
          ${cardRow('Order number', order.orderNumber, { first: true, display: true, color: C.accent })}
          ${cardRow('Order total', money(order.total))}
          ${cardRow('Status', 'CANCELLED', { color: C.error })}
        `)}

        ${wasPaid ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:14px 18px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.text};">
              <strong style="color:${C.success};">Your refund of ${money(order.total)} is being processed.</strong>
              It should reach your account within 5&ndash;7 business days.
            </td>
          </tr>
        </table>` : `
        <p style="margin:0 0 28px;font-family:${FONT};font-size:13px;line-height:1.7;color:${C.muted};">
          This was a cash-on-delivery order, so you have not been charged
          anything.
        </p>`}

        ${button(`${SITE_URL}/shop`, 'Browse the latest drops')}

        <p style="margin:20px 0 0;text-align:center;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.dim};">
          Cancelled by mistake, or want to reorder? Reply to this email and
          we will help.
        </p>
      </td>
    </tr>
    ${footer()}
  `,
    `${order.orderNumber} has been cancelled${wasPaid ? ' — refund on the way' : ''}`
  );

  return sendMail({
    to: order.email,
    subject: `Order Cancelled — ${order.orderNumber} | Beyond Stich`,
    html,
  });
}

/**
 * Return request outcome — approved or rejected.
 *
 * The storefront tells the customer "we'll be in touch within 24 hours"
 * when they raise a return, and then nothing was ever sent. They had no way
 * to learn the decision except by asking.
 */
export async function sendReturnUpdate(order, decision) {
  if (!order?.email) return { ok: false, error: 'no recipient' };

  const approved = decision === 'approved';
  const completed = decision === 'completed';
  const addr = order.shippingAddress || {};
  const firstName = String(addr.fullName || '').split(' ')[0];

  const title = completed ? 'Return complete' : approved ? 'Return approved' : 'Return not approved';

  const body = completed
    ? 'We have received your return. If a refund is due it will be processed next, and you will get a separate email once it is on its way.'
    : approved
      ? 'Your return has been approved. Our team will contact you shortly to arrange the pickup — please keep the item unworn and in its original packaging.'
      : 'We were not able to approve this return. If you think this is a mistake, just reply to this email and we will take another look.';

  const html = shell(
    `
    ${header()}
    <tr>
      <td style="padding:32px 28px;">
        ${h2(title, approved || completed ? C.text : C.error)}
        ${lead(`${firstName ? `Hi ${firstName} &mdash; ` : ''}${body}`)}

        ${orderCard(`
          ${cardRow('Order number', order.orderNumber, { first: true, display: true, color: C.accent })}
          ${cardRow('Return status', String(decision).toUpperCase(), {
            color: approved || completed ? C.success : C.error,
          })}
          ${order.returnRequest?.reason
            ? `<tr><td colspan="2" style="padding-top:10px;font-family:${FONT};font-size:12px;color:${C.dim};line-height:1.6;">Your reason: ${order.returnRequest.reason}</td></tr>`
            : ''}
        `)}

        ${button(`${SITE_URL}/account/orders/${encodeURIComponent(order.orderNumber)}`, 'View order')}
      </td>
    </tr>
    ${footer()}
  `,
    `Return ${decision} for ${order.orderNumber}`
  );

  return sendMail({
    to: order.email,
    subject: `${title} — ${order.orderNumber} | Beyond Stich`,
    html,
  });
}
