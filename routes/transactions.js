const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: 'business_id required' });
  res.json(db.prepare('SELECT * FROM transactions WHERE business_id = ? ORDER BY date DESC, id DESC').all(business_id));
});

router.post('/', (req, res) => {
  const { business_id, type, category, amount, date, description } = req.body;
  const result = db.prepare(
    'INSERT INTO transactions (business_id, type, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(business_id, type, category || null, parseFloat(amount), date, description || null);
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { type, category, amount, date, description } = req.body;
  db.prepare('UPDATE transactions SET type=?, category=?, amount=?, date=?, description=? WHERE id=?')
    .run(type, category || null, parseFloat(amount), date, description || null, req.params.id);
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
