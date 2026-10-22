// POST -> creates demo DRAFT invoices in the PayPal sandbox (example.com recipients only), capped.
const pp = require('../lib/paypal');
const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const DEMO = [
  { customer: 'Northwind Mining', email: 'ap@northwind.example.com', amount: 18500, dueDate: d(9), memo: 'Assay services - Oct' },
  { customer: 'Blue Ridge Supply', email: 'pay@blueridge.example.com', amount: 7200, dueDate: d(16), memo: 'Monthly retainer' },
  { customer: 'Harbor Logistics', email: 'finance@harbor.example.com', amount: 12000, dueDate: d(23), memo: 'Q4 consulting' },
  { customer: 'Summit Clinics', email: 'ap@summit.example.com', amount: 4300, dueDate: d(37), memo: 'Fractional CFO pack' }];
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!pp.configured()) return res.status(200).json({ mock: true, created: 0 });
  try {
    const open = await pp.listOpen();
    if (open.length >= 8) return res.status(200).json({ created: 0, note: 'Enough open invoices already.' });
    const created = [];
    for (const x of DEMO) created.push((await pp.createDraft(x)).id);
    res.status(200).json({ created: created.length, ids: created });
  } catch (e) { res.status(e.status || 502).json({ error: e.message, details: e.body?.details }); }
};
