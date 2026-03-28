const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './data/uploads',
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadFields = upload.fields([
  { name: 'logo',      maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]);

router.use(auth);

router.get('/', (req, res) => {
  const businesses = db.prepare('SELECT * FROM businesses WHERE user_id = ?').all(req.session.userId);
  res.json(businesses);
});

router.put('/:id', uploadFields, (req, res) => {
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const { name, address, email, phone, tax_number, bank_name, bank_account, bank_holder, tax_rate, invoice_prefix, logo_width, payment_instruction } = req.body;
  const logo = req.files?.logo?.[0] ? `/uploads/${req.files.logo[0].filename}` : biz.logo;
  // signature: accept drawn data URL OR uploaded file, else keep existing
  let signature = biz.signature;
  if (req.files?.signature?.[0])       signature = `/uploads/${req.files.signature[0].filename}`;
  else if (req.body.signature_data)    signature = req.body.signature_data;

  db.prepare(`
    UPDATE businesses SET name=?, address=?, email=?, phone=?, tax_number=?, bank_name=?, bank_account=?,
    bank_holder=?, tax_rate=?, logo=?, invoice_prefix=?, logo_width=?, payment_instruction=?, signature=? WHERE id=?
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
    logo_width !== undefined ? parseInt(logo_width) : (biz.logo_width ?? 120),
    payment_instruction !== undefined ? payment_instruction : biz.payment_instruction,
    signature,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id));
});

module.exports = router;
