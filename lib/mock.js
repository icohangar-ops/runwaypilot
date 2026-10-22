// MOCK fallback used only when PayPal env vars are missing. Clearly labeled in the UI.
const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
module.exports = () => [
  { id: 'MOCK-1', number: 'MOCK-0001', status: 'SENT', customer: 'Northwind Mining (mock)', email: 'ap@example.com', amount: 18500, currency: 'USD', due_date: d(9), memo: 'Assay services' },
  { id: 'MOCK-2', number: 'MOCK-0002', status: 'UNPAID', customer: 'Blue Ridge Supply (mock)', email: 'pay@example.com', amount: 7200, currency: 'USD', due_date: d(-4), memo: 'Overdue retainer' },
  { id: 'MOCK-3', number: 'MOCK-0003', status: 'DRAFT', customer: 'Harbor Logistics (mock)', email: 'finance@example.com', amount: 12000, currency: 'USD', due_date: d(23), memo: 'Q4 consulting' }];
