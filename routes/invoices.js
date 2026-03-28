const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: 'business_id required' });
  const rows = db.prepare(`
    SELECT i.*, c.name as client_name, c.company as client_company
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.business_id = ? ORDER BY i.created_at DESC
  `).all(business_id);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});

router.get('/next-number/:business_id', (req, res) => {
  const biz = db.prepare('SELECT invoice_prefix, tax_rate FROM businesses WHERE id = ?').get(req.params.business_id);
  const prefix = biz?.invoice_prefix || 'INV';
  const taxRate = biz?.tax_rate ?? 6;
  const last = db.prepare(
    'SELECT invoice_number FROM invoices WHERE business_id = ? ORDER BY id DESC LIMIT 1'
  ).get(req.params.business_id);
  let num = 1;
  if (last) {
    const match = last.invoice_number.match(/(\d+)$/);
    if (match) num = parseInt(match[1]) + 1;
  }
  res.json({ invoice_number: `${prefix}-${String(num).padStart(4, '0')}`, tax_rate: taxRate });
});

router.get('/:id', (req, res) => {
  const inv = db.prepare(`
    SELECT i.*,
      c.name as client_name, c.company as client_company, c.email as client_email,
      c.phone as client_phone, c.address as client_address,
      b.name as business_name, b.address as business_address, b.email as business_email,
      b.phone as business_phone, b.logo as business_logo, b.tax_number as business_tax_number,
      b.bank_name, b.bank_account, b.bank_holder, b.currency, b.logo_width, b.sign_width,
      b.payment_instruction, b.signature as business_signature
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN businesses b ON i.business_id = b.id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ ...inv, items: JSON.parse(inv.items) });
});

router.post('/', (req, res) => {
  const { business_id, client_id, invoice_number, status, date, due_date, items, subtotal, tax_rate, tax_amount, total, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO invoices (business_id, client_id, invoice_number, status, date, due_date, items, subtotal, tax_rate, tax_amount, total, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(business_id, client_id || null, invoice_number, status || 'draft', date, due_date || null,
    JSON.stringify(items || []), subtotal || 0, tax_rate || 0, tax_amount || 0, total || 0, notes || null);
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
  res.json({ ...inv, items: JSON.parse(inv.items) });
});

router.put('/:id', (req, res) => {
  const { client_id, invoice_number, status, date, due_date, items, subtotal, tax_rate, tax_amount, total, notes } = req.body;
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE invoices SET client_id=?, invoice_number=?, status=?, date=?, due_date=?,
    items=?, subtotal=?, tax_rate=?, tax_amount=?, total=?, notes=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(client_id || null, invoice_number, status, date, due_date || null,
    JSON.stringify(items || []), subtotal, tax_rate, tax_amount, total, notes || null, req.params.id);

  // Auto-log income transaction when marking paid
  if (status === 'paid' && existing.status !== 'paid') {
    const client = client_id ? db.prepare('SELECT name FROM clients WHERE id = ?').get(client_id) : null;
    db.prepare(`
      INSERT INTO transactions (business_id, type, category, amount, date, description, invoice_id)
      VALUES (?, 'income', 'Invoice Payment', ?, ?, ?, ?)
    `).run(existing.business_id, total, date,
      `Payment for ${invoice_number}${client ? ` — ${client.name}` : ''}`, req.params.id);
  }

  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json({ ...inv, items: JSON.parse(inv.items) });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
