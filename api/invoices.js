const pp = require('../lib/paypal'), mock = require('../lib/mock');
module.exports = async (req, res) => {
  if (!pp.configured()) return res.status(200).json({ source: 'mock', invoices: mock() });
  try { res.status(200).json({ source: 'paypal-sandbox', invoices: await pp.listOpen() }); }
  catch (e) { res.status(502).json({ source: 'paypal-sandbox', error: e.message }); }
};
