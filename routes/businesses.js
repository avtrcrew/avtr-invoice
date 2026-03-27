const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './data/uploads',
  filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(auth);

router.get('/', (req, res) => {
  const businesses = db.prepare('SELECT * FROM businesses WHERE user_id = ?').all(req.session.userId);
  res.json(businesses);
});

router.put('/:id', upload.single('logo'), (req, res) => {
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const { name, address, email, phone, tax_number, bank_name, bank_account, bank_holder, tax_rate, invoice_prefix } = req.body;
  const logo = req.file ? `/uploads/${req.file.filename}` : biz.logo;

  db.prepare(`
    UPDATE businesses SET name=?, address=?, email=?, phone=?, tax_number=?, bank_name=?, bank_account=?,
    bank_holder=?, tax_rate=?, logo=?, invoice_prefix=? WHERE id=?
  `).run(
    name ?? biz.name,
    address ?? biz.address,
    email ?? biz.email,
    phone ?? biz.phone,
    tax_number ?? biz.tax_number,
    bank_name ?? biz.bank_name,
    bank_account ?? biz.bank_account,
    bank_holder ?? biz.bank_holder,
    tax_rate !== undefined ? parseFloat(tax_rate) : biz.tax_rate,
    logo,
    invoice_prefix ?? biz.invoice_prefix,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id));
});

module.exports = router;
