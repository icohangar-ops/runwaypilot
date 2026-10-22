// POST {forecast:[{week,in,out,bal}], floor, invoices:[...], workspace} -> AI weekly CFO memo + invoice chase priority.
// Uses OPENAI_API_KEY server-side; deterministic fallback if missing or the call fails.
function score(inv, breachWeek) {
  const days = Math.round((new Date(inv.due_date) - Date.now()) / 864e5);
  const overdue = days < 0 ? 40 + Math.min(30, -days) : 0;
  const beforeBreach = breachWeek && days <= breachWeek * 7 ? 25 : 0;
  const draft = inv.status === 'DRAFT' ? 15 : 0;
  return Math.round(overdue + beforeBreach + draft + Math.min(30, inv.amount / 1000));
}
function fallback(body, ranked, breach) {
  const top = ranked.slice(0, 3).map((r, i) => `${i + 1}. ${r.customer} $${r.amount.toLocaleString()} (${r.status}, due ${r.due_date}) - ${r.action}`).join('\n');
  return `WEEKLY CFO MEMO - ${body.workspace || 'Client'}\n\n` + (breach ? `Cash is forecast to fall below the $${(body.floor || 0).toLocaleString()} floor in week ${breach.week}. ` : 'Cash stays above the floor for all 13 weeks. ') +
    `Open PayPal receivables total $${ranked.reduce((a, r) => a + r.amount, 0).toLocaleString()}.\n\nChase first:\n${top}\n\n(Deterministic memo: AI unavailable.)`;
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = req.body || {}; const fc = (body.forecast || []).slice(0, 13); const invs = (body.invoices || []).slice(0, 25);
  const floorC = (body.floor || 0) * 100; const breach = fc.find((w) => w.bal < floorC);
  const ranked = invs.map((i) => ({ ...i, priority: score(i, breach?.week), action: i.status === 'DRAFT' ? 'send' : 'remind' })).sort((a, b) => b.priority - a.priority);
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ ai: false, memo: fallback(body, ranked, breach), ranked });
  const facts = { today: new Date().toISOString().slice(0, 10), workspace: body.workspace, opening_cash_usd: body.opening ?? null, floor_usd: body.floor, breach_week: breach?.week || null,
    weeks: fc.map((w) => ({ week: w.week, inflow_usd: w.in / 100, outflow_usd: w.out / 100, balance_usd: w.bal / 100 })),
    invoices: ranked.map(({ id, customer, amount, status, due_date, priority, action }) => ({ id, customer, amount, status, due_date, priority, action, days_until_due: Math.round((new Date(due_date) - Date.now()) / 864e5), is_overdue: new Date(due_date) < Date.now() })) };
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.2, max_tokens: 700, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: 'You are a fractional CFO writing a weekly cash memo for a small-business owner. Use only the numbers provided; never invent figures. Only call an invoice overdue if is_overdue is true; otherwise say when it is due. Weekly balances are end-of-week projections, not current cash; current cash is opening_cash_usd. DRAFT invoices have not been sent yet. Return JSON: {"memo": string (<=180 words, plain text, sections: Position, Risk, Actions this week), "chase_order": [invoice ids in the order to chase], "reasons": {invoice_id: one short sentence}}.' },
          { role: 'user', content: JSON.stringify(facts) }] }) });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    const j = JSON.parse((await r.json()).choices[0].message.content);
    const order = (j.chase_order || []).filter((id) => ranked.some((x) => x.id === id));
    const final = [...order.map((id) => ranked.find((x) => x.id === id)), ...ranked.filter((x) => !order.includes(x.id))].map((x) => ({ ...x, reason: j.reasons?.[x.id] || '' }));
    res.status(200).json({ ai: true, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', memo: j.memo, ranked: final });
  } catch (e) { res.status(200).json({ ai: false, error: e.message, memo: fallback(body, ranked, breach), ranked }); }
};
