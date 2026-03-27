const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: 'business_id required' });
  res.json(db.prepare('SELECT * FROM items_catalog WHERE business_id = ? ORDER BY name ASC').all(business_id));
});

router.post('/', (req, res) => {
  const { business_id, name, description, unit_price } = req.body;
  if (!name || !business_id) return res.status(400).json({ error: 'business_id and name required' });

  // Upsert — update if same name already exists for this business
  const existing = db.prepare('SELECT * FROM items_catalog WHERE business_id = ? AND name = ?').get(business_id, name);
  if (existing) {
    db.prepare('UPDATE items_catalog SET description=?, unit_price=? WHERE id=?')
      .run(description || null, parseFloat(unit_price) || 0, existing.id);
    return res.json(db.prepare('SELECT * FROM items_catalog WHERE id = ?').get(existing.id));
  }
  const result = db.prepare(
    'INSERT INTO items_catalog (business_id, name, description, unit_price) VALUES (?, ?, ?, ?)'
  ).run(business_id, name, description || null, parseFloat(unit_price) || 0);
  res.json(db.prepare('SELECT * FROM items_catalog WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM items_catalog WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
