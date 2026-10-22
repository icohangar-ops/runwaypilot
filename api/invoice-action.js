// POST {id, action: "send"|"remind"} -> sends a DRAFT or reminds on a SENT/UNPAID invoice.
const pp = require('../lib/paypal');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { id, action } = req.body || {};
  if (!id || !['send', 'remind'].includes(action)) return res.status(400).json({ error: 'id and action (send|remind) required' });
  if (!pp.configured() || String(id).startsWith('MOCK')) return res.status(200).json({ ok: true, mock: true, id, action, status: action === 'send' ? 'SENT' : 'REMINDED (mock)' });
  try {
    const inv = await pp.get(id);
    if (!/[@.]example\.(com|org)$/i.test(inv.email)) return res.status(403).json({ error: 'Demo safety: only example.com sandbox recipients can be contacted from the public demo.' });
    if (action === 'send' && inv.status !== 'DRAFT') return res.status(409).json({ error: `Invoice is ${inv.status}; use remind.` });
    if (action === 'remind' && inv.status === 'DRAFT') return res.status(409).json({ error: 'Invoice is a draft; send it first.' });
    await (action === 'send' ? pp.send(id) : pp.remind(id));
    const after = await pp.get(id);
    res.status(200).json({ ok: true, id, action, status: after.status });
  } catch (e) { res.status(e.status || 502).json({ error: e.message }); }
};
