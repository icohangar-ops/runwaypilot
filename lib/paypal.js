// Server-side PayPal sandbox Invoicing client. Credentials come only from env vars.
const BASE = (process.env.PAYPAL_MODE === 'live') ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const configured = () => !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
let cache = { token: null, exp: 0 };
async function token() {
  if (cache.token && Date.now() < cache.exp) return cache.token;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  if (!r.ok) throw new Error(`PayPal auth failed (${r.status})`);
  const j = await r.json(); cache = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return cache.token;
}
async function pp(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { ...opts, headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(opts.headers || {}) } });
  const text = await r.text(); let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!r.ok) { const e = new Error(body.message || body.name || `PayPal ${r.status}`); e.status = r.status; e.body = body; throw e; }
  return body;
}
const OPEN = new Set(['DRAFT', 'SENT', 'UNPAID', 'PARTIALLY_PAID', 'SCHEDULED']);
function normalize(inv) {
  const d = inv.detail || {}, amt = inv.amount || {}, due = inv.due_amount || amt;
  return { id: inv.id, number: d.invoice_number, status: inv.status, customer: inv.primary_recipients?.[0]?.billing_info?.business_name || inv.primary_recipients?.[0]?.billing_info?.email_address || 'Customer',
    email: inv.primary_recipients?.[0]?.billing_info?.email_address || '', amount: Number(due.value || amt.value || 0), currency: due.currency_code || amt.currency_code || 'USD',
    due_date: d.payment_term?.due_date || d.invoice_date, invoice_date: d.invoice_date, memo: d.memo || '' };
}
async function listOpen() {
  const out = [];
  for (let page = 1; page <= 3; page++) {
    const j = await pp(`/v2/invoicing/invoices?page=${page}&page_size=50&total_required=true&fields=amount`);
    for (const it of j.items || []) { if (OPEN.has(it.status)) out.push(normalize(await pp(`/v2/invoicing/invoices/${it.id}`))); }
    if (!j.total_pages || page >= j.total_pages) break;
  }
  return out;
}
const send = (id) => pp(`/v2/invoicing/invoices/${id}/send`, { method: 'POST', body: JSON.stringify({ send_to_invoicer: false, send_to_recipient: true }) });
const remind = (id) => pp(`/v2/invoicing/invoices/${id}/remind`, { method: 'POST', body: JSON.stringify({ subject: 'Friendly reminder: invoice due', note: 'Sent by RunwayPilot on behalf of the business.', send_to_invoicer: false }) });
const get = (id) => pp(`/v2/invoicing/invoices/${id}`).then(normalize);
async function createDraft({ customer, email, amount, dueDate, memo }) {
  const nxt = await pp('/v2/invoicing/generate-next-invoice-number', { method: 'POST' });
  return pp('/v2/invoicing/invoices', { method: 'POST', body: JSON.stringify({
    detail: { invoice_number: nxt.invoice_number, currency_code: 'USD', memo, payment_term: { due_date: dueDate }, note: 'Demo invoice created by RunwayPilot (PayPal sandbox).' },
    primary_recipients: [{ billing_info: { business_name: customer, email_address: email } }],
    items: [{ name: memo || 'Services', quantity: '1', unit_amount: { currency_code: 'USD', value: amount.toFixed(2) } }] }) });
}
module.exports = { configured, listOpen, send, remind, get, createDraft, BASE };
