const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: 'business_id required' });
  res.json(db.prepare('SELECT * FROM clients WHERE business_id = ? ORDER BY name ASC').all(business_id));
});

router.post('/', (req, res) => {
  const { business_id, name, company, email, phone, address } = req.body;
  const result = db.prepare(
    'INSERT INTO clients (business_id, name, company, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(business_id, name, company || null, email || null, phone || null, address || null);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, company, email, phone, address } = req.body;
  db.prepare('UPDATE clients SET name=?, company=?, email=?, phone=?, address=? WHERE id=?')
    .run(name, company || null, email || null, phone || null, address || null, req.params.id);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
