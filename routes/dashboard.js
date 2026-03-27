const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: 'business_id required' });

  const totalInvoiced = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE business_id = ? AND status != 'draft'"
  ).get(business_id).v;

  const totalPaid = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE business_id = ? AND status = 'paid'"
  ).get(business_id).v;

  const totalOutstanding = db.prepare(
    "SELECT COALESCE(SUM(total), 0) as v FROM invoices WHERE business_id = ? AND status IN ('sent', 'overdue')"
  ).get(business_id).v;

  const totalExpenses = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as v FROM transactions WHERE business_id = ? AND type = 'expense'"
  ).get(business_id).v;

  const overdueCount = db.prepare(
    "SELECT COUNT(*) as v FROM invoices WHERE business_id = ? AND due_date < date('now') AND status NOT IN ('paid', 'draft')"
  ).get(business_id).v;

  const recentInvoices = db.prepare(`
    SELECT i.*, c.name as client_name FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.business_id = ? ORDER BY i.created_at DESC LIMIT 5
  `).all(business_id).map(r => ({ ...r, items: JSON.parse(r.items) }));

  const recentTransactions = db.prepare(
    'SELECT * FROM transactions WHERE business_id = ? ORDER BY date DESC, id DESC LIMIT 5'
  ).all(business_id);

  const monthlyData = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM transactions
    WHERE business_id = ? AND date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all(business_id);

  res.json({ totalInvoiced, totalPaid, totalOutstanding, totalExpenses, overdueCount, recentInvoices, recentTransactions, monthlyData });
});

module.exports = router;
