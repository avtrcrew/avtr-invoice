import { useEffect, useState, useRef } from 'react'
import { useApp } from '../App'
import axios from 'axios'
import { Save, Upload, Eye, EyeOff, Building2, Lock } from 'lucide-react'
import SignaturePad from '../components/SignaturePad'

// ─── Field helpers defined OUTSIDE component so React never remounts them ──────
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        className="input"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function PhoneField({ label, value, onChange, placeholder }) {
  // Only allow digits, +, -, spaces, ( )
  const handleChange = (e) => {
    const raw = e.target.value
    const cleaned = raw.replace(/[^\d\s\+\-\(\)]/g, '')
    onChange(cleaned)
  }
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type="tel"
        inputMode="tel"
        className="input"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleChange}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <textarea
        className="input resize-none h-24"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

// ── Mini invoice header preview ──────────────────────────────────────────────
function LogoPreview({ logoSrc, logoWidth, businessName }) {
  const w = logoWidth ?? 120
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', maxWidth: 400 }}>
      <div style={{ position: 'relative', height: 90, background: '#fff' }}>
        {/* SVG geometric header */}
        <svg width="100%" height="90" viewBox="0 0 400 90" preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <polygon points="0,0 290,0 210,90 0,90" fill="#111827" />
          <polygon points="250,0 320,0 240,90 170,90" fill="#dc2626" />
          <polygon points="300,0 400,0 400,90 220,90" fill="#111827" />
          <polygon points="365,0 400,0 400,32" fill="#dc2626" opacity="0.7" />
        </svg>
        {/* Logo */}
        <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 2 }}>
          {logoSrc ? (
            <div style={{ background: '#fff', borderRadius: 6, padding: '4px 7px', display: 'inline-block', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
              <img src={logoSrc} alt="Logo" style={{ width: w * 0.5, maxWidth: 130, maxHeight: 50, objectFit: 'contain', display: 'block' }} />
            </div>
          ) : (
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>{businessName}</div>
          )}
        </div>
        {/* INVOICE text */}
        <div style={{ position: 'absolute', right: 14, top: 14, zIndex: 2, textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 3 }}>INVOICE</div>
          <div style={{ color: '#fca5a5', fontSize: 8, fontWeight: 600 }}>INV-0001</div>
        </div>
      </div>
      <div style={{ padding: '4px 10px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>Preview — logo at {w}px wide</p>
      </div>
    </div>
  )
}

// ── Mini signature preview ────────────────────────────────────────────────────
function SignaturePreview({ sigSrc, signWidth, businessName }) {
  const h = signWidth ?? 72
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 18px', maxWidth: 300, background: '#fff' }}>
      {sigSrc ? (
        <img src={sigSrc} alt="Signature" style={{ height: h, maxWidth: 260, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
      ) : (
        <div style={{ height: h, borderBottom: '1.5px solid #374151', marginBottom: 4 }} />
      )}
      <div style={{ borderTop: sigSrc ? '1.5px solid #374151' : 'none', paddingTop: 5, textAlign: 'center', marginTop: 4 }}>
        <div style={{ fontSize: 10, color: '#6b7280' }}>Authorised Signature</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{businessName}</div>
      </div>
      <p style={{ fontSize: 10, color: '#6b7280', marginTop: 6, marginBottom: 0 }}>Preview — signature at {h}px tall</p>
    </div>
  )
}
// ──────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { businesses, refreshBusinesses } = useApp()
  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const fileRef = useRef()

  const [bizForms, setBizForms]       = useState([])
  const [savingSig, setSavingSig]     = useState(false)
  const [sigSaved, setSigSaved]       = useState(false)
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    if (businesses.length) {
      setBizForms(businesses.map(b => ({
        name:                b.name || '',
        address:             b.address || '',
        email:               b.email || '',
        phone:               b.phone || '',
        tax_number:          b.tax_number || '',
        bank_name:           b.bank_name || '',
        bank_account:        b.bank_account || '',
        bank_holder:         b.bank_holder || '',
        tax_rate:            b.tax_rate ?? 0,
        invoice_prefix:      b.invoice_prefix || 'INV',
        logo_width:          b.logo_width ?? 120,
        sign_width:          b.sign_width ?? 72,
        payment_instruction: b.payment_instruction || '',
        logo:                b.logo || '',
        signature:           b.signature || '',
      })))
    }
  }, [businesses])

  const set = (idx, field) => (val) =>
    setBizForms(forms => forms.map((f, i) => i === idx ? { ...f, [field]: val } : f))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSaveSignature = async (dataURL) => {
    setSavingSig(true)
    setSigSaved(false)
    try {
      const biz = businesses[activeTab]
      const form = bizForms[activeTab]
      const fd  = new FormData()
      fd.append('name',           form.name || biz.name)
      fd.append('signature_data', dataURL)
      fd.append('sign_width',     form.sign_width ?? 72)
      await axios.put(`/api/businesses/${biz.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshBusinesses()
      setBizForms(forms => forms.map((f, i) => i === activeTab ? { ...f, signature: dataURL } : f))
      setSigSaved(true)
      setTimeout(() => setSigSaved(false), 2500)
    } finally { setSavingSig(false) }
  }

  const handleSaveBusiness = async (idx) => {
    setSaving(true)
    setSaved(false)
    try {
      const biz = businesses[idx]
      const form = bizForms[idx]
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (k !== 'logo' && k !== 'signature') fd.append(k, v ?? '') })
      if (logoFile && activeTab === idx) fd.append('logo', logoFile)
      await axios.put(`/api/businesses/${biz.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshBusinesses()
      setSaved(true)
      setLogoFile(null)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const handleChangePw = async () => {
    setPwError('')
    if (pw.newPw !== pw.confirm) { setPwError('New passwords do not match.'); return }
    if (pw.newPw.length < 6)    { setPwError('Password must be at least 6 characters.'); return }
    try {
      await axios.put('/api/auth/password', { currentPassword: pw.current, newPassword: pw.newPw })
      setPw({ current: '', newPw: '', confirm: '' })
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 3000)
    } catch (e) {
      setPwError(e.response?.data?.error || 'Failed to change password.')
    }
  }

  if (!bizForms.length) return <div className="p-8 text-gray-400">Loading…</div>

  const idx  = activeTab === 'password' ? 0 : activeTab
  const form = bizForms[idx] || {}

  const currentLogoSrc = logoPreview || form.logo || null

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your businesses and account</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {businesses.map((biz, i) => (
          <button
            key={biz.id}
            onClick={() => { setActiveTab(i); setLogoPreview(null); setLogoFile(null); setSaved(false) }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
              activeTab === i ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {biz.name}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'password' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Password
        </button>
      </div>

      {/* ── Password Tab ── */}
      {activeTab === 'password' ? (
        <div className="card p-6 max-w-md space-y-4">
          <h2 className="font-semibold text-gray-800">Change Password</h2>

          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password',     key: 'newPw'   },
            { label: 'Confirm Password', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={pw[key]}
                  onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {pwError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>}
          {pwSaved && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Password changed successfully.</p>}

          <button
            onClick={handleChangePw}
            disabled={!pw.current || !pw.newPw || !pw.confirm}
            className="btn-primary disabled:opacity-50"
          >
            <Lock className="w-4 h-4" /> Change Password
          </button>
        </div>

      ) : (
        /* ── Business Tab ── */
        <div className="space-y-5">

          {/* Logo */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Business Logo</h2>

            <div className="space-y-4">
              {/* Upload button */}
              <div className="flex items-center gap-4">
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0"
                  style={{ width: 80, height: 56 }}
                >
                  {currentLogoSrc ? (
                    <img src={currentLogoSrc} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span className="text-gray-300 text-xs text-center px-2">No logo</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button onClick={() => fileRef.current.click()} className="btn-secondary">
                    <Upload className="w-4 h-4" /> Upload Logo
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PNG with transparent background recommended</p>
                </div>
              </div>

              {/* Logo size slider */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Logo Size on Invoice — <span className="text-red-600 font-bold">{form.logo_width ?? 120}px</span>
                </label>
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="10"
                  className="w-full accent-red-600"
                  value={form.logo_width ?? 120}
                  onChange={e => set(idx, 'logo_width')(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5 mb-3">
                  <span>Small</span><span>Large</span>
                </div>
                {/* Live invoice header preview */}
                <LogoPreview logoSrc={currentLogoSrc} logoWidth={form.logo_width ?? 120} businessName={form.name} />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Business Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name *"  value={form.name}       onChange={set(idx,'name')}       placeholder="My Business Sdn Bhd" />
              <Field label="Email"            value={form.email}      onChange={set(idx,'email')}      type="email" placeholder="hello@mybusiness.com" />
              <PhoneField label="Phone"       value={form.phone}      onChange={set(idx,'phone')}      placeholder="+60123456789" />
              <Field label="Tax / SSM Number" value={form.tax_number} onChange={set(idx,'tax_number')} placeholder="SSM 12345678" />
            </div>
            <TextArea
              label="Address"
              value={form.address}
              onChange={set(idx,'address')}
              placeholder="No. 1, Jalan Bukit Bintang, 55100 Kuala Lumpur"
            />
          </div>

          {/* Invoice Settings */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Invoice Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Prefix"     value={form.invoice_prefix} onChange={set(idx,'invoice_prefix')} placeholder="INV" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Tax Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="input"
                  value={form.tax_rate ?? 0}
                  onChange={e => set(idx,'tax_rate')(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Set 0 for no tax. Applied automatically on new invoices.</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Bank / Payment Details</h2>
            <p className="text-xs text-gray-400">These appear on your invoices so clients know where to pay.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name"           value={form.bank_name}    onChange={set(idx,'bank_name')}    placeholder="Maybank" />
              <Field label="Account Number"      value={form.bank_account} onChange={set(idx,'bank_account')} placeholder="5123 4567 8901" />
              <Field label="Account Holder Name" value={form.bank_holder}  onChange={set(idx,'bank_holder')}  placeholder="My Business Sdn Bhd" />
            </div>
            <TextArea
              label="Payment Instruction (shown on invoice)"
              value={form.payment_instruction}
              onChange={set(idx,'payment_instruction')}
              placeholder="e.g. Please transfer within 7 days. Use invoice number as reference."
            />
          </div>

          {/* Owner Signature */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-1">Owner / Authorised Signature</h2>
            <p className="text-xs text-gray-400 mb-4">
              Draw your signature below. It will appear on every invoice.
            </p>
            <SignaturePad
              existing={form.signature}
              onSave={handleSaveSignature}
              saving={savingSig}
            />
            {sigSaved && (
              <p className="text-sm text-green-600 mt-2">✓ Signature saved.</p>
            )}

            {/* Signature size slider + preview */}
            {form.signature && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Signature Size on Invoice — <span className="text-red-600 font-bold">{form.sign_width ?? 72}px</span> tall
                </label>
                <input
                  type="range"
                  min="40"
                  max="140"
                  step="4"
                  className="w-full accent-red-600"
                  value={form.sign_width ?? 72}
                  onChange={e => set(idx, 'sign_width')(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5 mb-3">
                  <span>Small</span><span>Large</span>
                </div>
                <SignaturePreview sigSrc={form.signature} signWidth={form.sign_width ?? 72} businessName={form.name} />
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pb-4">
            <button
              onClick={() => handleSaveBusiness(idx)}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved successfully</span>}
          </div>
        </div>
      )}
    </div>
  )
}
