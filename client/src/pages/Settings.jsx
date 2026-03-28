import { useEffect, useState, useRef } from 'react'
import { useApp } from '../App'
import axios from 'axios'
import { Save, Upload, Eye, EyeOff, Building2, Lock, Image } from 'lucide-react'
import SignaturePad from '../components/SignaturePad'

// ─── Field helpers defined OUTSIDE component so React never remounts them ─────
function Field({ label, value, onChange, type = 'text', placeholder, hint }) {
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
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function PhoneField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type="tel"
        inputMode="tel"
        className="input"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange(e.target.value.replace(/[^\d\s+\-()/]/g, ''))}
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

// ── Mini invoice header preview — matches new red/white design ───────────────
function LogoPreview({ logoSrc, logoWidth, businessName }) {
  const w = logoWidth ?? 120
  // Scale the preview to 50% so it fits in the settings panel
  const scale = 0.5
  const previewW = Math.round(w * scale)
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', maxWidth: 420 }}>
      {/* Red header — mirrors actual invoice layout */}
      <div style={{
        background: '#dc2626',
        padding: '14px 16px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8
      }}>
        {/* Logo + name column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
          {logoSrc ? (
            <>
              <img
                src={logoSrc}
                alt="Logo"
                style={{ width: previewW, height: 'auto', maxHeight: 50, objectFit: 'contain', display: 'block', alignSelf: 'flex-start' }}
              />
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 8, fontWeight: 700, marginTop: 4 }}>
                {businessName}
              </div>
            </>
          ) : (
            <div style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>{businessName}</div>
          )}
        </div>
        {/* INVOICE title */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: 3, lineHeight: 1 }}>INVOICE</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 4 }}>INV-0001</div>
        </div>
      </div>
      {/* Footer label */}
      <div style={{ padding: '5px 10px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>Preview — logo width <strong>{w}px</strong> on invoice</p>
      </div>
    </div>
  )
}

// ── Mini signature preview ─────────────────────────────────────────────────
function SignaturePreview({ sigSrc, signWidth, signPosition, businessName }) {
  const h = signWidth ?? 72
  const align = signPosition === 'left' ? 'flex-start' : signPosition === 'center' ? 'center' : 'flex-end'
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 18px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: align }}>
        <div style={{ textAlign: 'center', minWidth: 180 }}>
          {sigSrc ? (
            <img src={sigSrc} alt="Signature" style={{ height: h, maxWidth: 240, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          ) : (
            <div style={{ height: h, borderBottom: '1.5px solid #374151' }} />
          )}
          <div style={{ borderTop: sigSrc ? '1.5px solid #374151' : 'none', paddingTop: 5, marginTop: 4 }}>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Authorised Signature</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{businessName}</div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 10, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
        Preview — {h}px tall · position: {signPosition || 'right'}
      </p>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function buildFormFromBiz(b) {
  return {
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
    sign_position:       b.sign_position || 'right',
    payment_instruction: b.payment_instruction || '',
    logo:                b.logo || '',
    signature:           b.signature || '',
  }
}

export default function Settings() {
  const { businesses, refreshBusinesses, appLogo, setAppLogo } = useApp()
  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile]       = useState(null)
  const fileRef    = useRef()

  // App logo (global)
  const [appLogoPreview, setAppLogoPreview] = useState(null)
  const [appLogoFile, setAppLogoFile]       = useState(null)
  const [savingAppLogo, setSavingAppLogo]   = useState(false)
  const [appLogoSaved, setAppLogoSaved]     = useState(false)
  const appLogoRef = useRef()

  // bizForms — only initialized ONCE from businesses data
  const [bizForms, setBizForms] = useState([])
  const initialized = useRef(false)

  const [savingSig, setSavingSig] = useState(false)
  const [sigSaved, setSigSaved]   = useState(false)

  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  // Initialize forms ONCE when businesses first arrive — not on every context refresh
  useEffect(() => {
    if (businesses.length && !initialized.current) {
      initialized.current = true
      setBizForms(businesses.map(buildFormFromBiz))
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

  // ── App logo upload ────────────────────────────────────────────────────────
  const handleAppLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAppLogoFile(file)
    setAppLogoPreview(URL.createObjectURL(file))
  }

  const handleSaveAppLogo = async () => {
    if (!appLogoFile) return
    setSavingAppLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', appLogoFile)
      // NOTE: Do NOT manually set Content-Type — let browser set multipart boundary automatically
      const res = await axios.put('/api/settings/app-logo', fd)
      setAppLogo(res.data.logo)
      setAppLogoSaved(true)
      setAppLogoFile(null)
      setTimeout(() => setAppLogoSaved(false), 3000)
    } catch (e) {
      console.error('App logo save failed:', e)
    } finally { setSavingAppLogo(false) }
  }

  // ── Signature save ─────────────────────────────────────────────────────────
  const handleSaveSignature = async (dataURL) => {
    const tabIdx = typeof activeTab === 'number' ? activeTab : 0
    setSavingSig(true)
    setSigSaved(false)
    try {
      const biz  = businesses[tabIdx]
      const form = bizForms[tabIdx] || {}
      const fd   = new FormData()
      fd.append('name',           form.name || biz.name)
      fd.append('signature_data', dataURL)
      fd.append('sign_width',     String(form.sign_width ?? 72))
      fd.append('sign_position',  form.sign_position || 'right')
      // NOTE: No Content-Type override — let browser handle multipart boundary
      await axios.put(`/api/businesses/${biz.id}`, fd)
      setBizForms(forms => forms.map((f, i) => i === tabIdx ? { ...f, signature: dataURL } : f))
      setSigSaved(true)
      setTimeout(() => setSigSaved(false), 2500)
    } catch (e) {
      console.error('Signature save failed:', e)
    } finally { setSavingSig(false) }
  }

  // ── Business settings save ─────────────────────────────────────────────────
  const handleSaveBusiness = async (tabIdx) => {
    setSaving(true)
    setSaved(false)
    setSaveErr('')
    try {
      const biz  = businesses[tabIdx]
      const form = bizForms[tabIdx] || {}
      const fd   = new FormData()

      // Append all text fields (skip logo URL and signature URL — handled separately)
      const textFields = [
        'name', 'address', 'email', 'phone', 'tax_number',
        'bank_name', 'bank_account', 'bank_holder',
        'tax_rate', 'invoice_prefix', 'logo_width', 'sign_width', 'sign_position',
        'payment_instruction'
      ]
      textFields.forEach(k => fd.append(k, form[k] !== undefined && form[k] !== null ? String(form[k]) : ''))

      // Attach logo file if a new one was selected for this tab
      if (logoFile && activeTab === tabIdx) fd.append('logo', logoFile)

      // NOTE: Do NOT manually set Content-Type — let browser set multipart boundary
      const res = await axios.put(`/api/businesses/${biz.id}`, fd)

      // Update local form with confirmed server data (not a full businesses reload)
      setBizForms(forms => forms.map((f, i) => i === tabIdx ? buildFormFromBiz(res.data) : f))

      // Refresh context so sidebar logo / business switcher are current
      await refreshBusinesses()

      setSaved(true)
      setLogoFile(null)
      setLogoPreview(null)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Save failed:', e)
      setSaveErr(e.response?.data?.error || 'Save failed. Please try again.')
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

  if (!bizForms.length) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
      Loading settings…
    </div>
  )

  const tabIdx = typeof activeTab === 'number' ? activeTab : 0
  const form   = bizForms[tabIdx] || {}
  const currentLogoSrc = logoPreview || form.logo || null

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your businesses and account</p>
      </div>

      {/* ── App Logo (global) ── */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-800 text-sm mb-1 flex items-center gap-2">
          <Image className="w-4 h-4 text-red-600" /> App Logo
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          This logo appears in the sidebar for all businesses. Upload your main brand logo here.
        </p>
        <div className="flex items-center gap-5 flex-wrap">
          {(appLogoPreview || appLogo) && (
            <div style={{ background: '#111827', borderRadius: 8, padding: '8px 14px', display: 'inline-flex', alignItems: 'center' }}>
              <img
                src={appLogoPreview || appLogo}
                alt="App Logo Preview"
                style={{ maxHeight: 48, maxWidth: 140, objectFit: 'contain', display: 'block' }}
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" ref={appLogoRef} className="hidden" onChange={handleAppLogoChange} />
              <button onClick={() => appLogoRef.current.click()} className="btn-secondary">
                <Upload className="w-4 h-4" /> Choose Logo
              </button>
              {appLogoFile && (
                <button onClick={handleSaveAppLogo} disabled={savingAppLogo} className="btn-primary disabled:opacity-50">
                  <Save className="w-4 h-4" /> {savingAppLogo ? 'Saving…' : 'Save App Logo'}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">PNG with transparent background recommended. Max 5MB.</p>
            {appLogoSaved && <p className="text-xs text-green-600">✓ App logo updated!</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {businesses.map((biz, i) => (
          <button
            key={biz.id}
            onClick={() => { setActiveTab(i); setLogoPreview(null); setLogoFile(null); setSaved(false); setSaveErr('') }}
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
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {pwError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>}
          {pwSaved && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Password changed.</p>}
          <button onClick={handleChangePw} disabled={!pw.current || !pw.newPw || !pw.confirm}
            className="btn-primary disabled:opacity-50">
            <Lock className="w-4 h-4" /> Change Password
          </button>
        </div>

      ) : (
        /* ── Business Tab ── */
        <div className="space-y-5">

          {/* Logo */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Business Logo (on Invoice)</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0"
                  style={{ width: 80, height: 56 }}>
                  {currentLogoSrc
                    ? <img src={currentLogoSrc} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span className="text-gray-300 text-xs text-center px-2">No logo</span>}
                </div>
                <div>
                  <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleLogoChange} />
                  <button onClick={() => fileRef.current.click()} className="btn-secondary">
                    <Upload className="w-4 h-4" /> Upload Logo
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Logo Width on Invoice — <span className="text-red-600 font-bold">{form.logo_width ?? 120}px</span>
                </label>
                <input type="range" min="60" max="240" step="10" className="w-full accent-red-600"
                  value={form.logo_width ?? 120}
                  onChange={e => set(tabIdx, 'logo_width')(parseInt(e.target.value))} />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5 mb-3">
                  <span>Small</span><span>Large</span>
                </div>
                <LogoPreview logoSrc={currentLogoSrc} logoWidth={form.logo_width ?? 120} businessName={form.name} />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Business Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name *"  value={form.name}       onChange={set(tabIdx,'name')}       placeholder="My Business Sdn Bhd" />
              <Field label="Email"            value={form.email}      onChange={set(tabIdx,'email')}      type="email" placeholder="hello@mybusiness.com" />
              <PhoneField label="Phone"       value={form.phone}      onChange={set(tabIdx,'phone')}      placeholder="+60123456789" />
              <Field label="Tax / SSM Number" value={form.tax_number} onChange={set(tabIdx,'tax_number')} placeholder="SSM 12345678" />
            </div>
            <TextArea label="Address" value={form.address} onChange={set(tabIdx,'address')}
              placeholder="No. 1, Jalan Bukit Bintang, 55100 Kuala Lumpur" />
          </div>

          {/* Invoice Settings */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Invoice Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Prefix" value={form.invoice_prefix} onChange={set(tabIdx,'invoice_prefix')} placeholder="INV" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" className="input"
                  value={form.tax_rate ?? 0}
                  onChange={e => set(tabIdx,'tax_rate')(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Set 0 to disable tax. Applied automatically on new invoices.</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Bank / Payment Details</h2>
            <p className="text-xs text-gray-400">These appear on your invoices.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name"           value={form.bank_name}    onChange={set(tabIdx,'bank_name')}    placeholder="Maybank" />
              <Field label="Account Number"      value={form.bank_account} onChange={set(tabIdx,'bank_account')} placeholder="5123 4567 8901" />
              <Field label="Account Holder Name" value={form.bank_holder}  onChange={set(tabIdx,'bank_holder')}  placeholder="My Business Sdn Bhd" />
            </div>
            <TextArea label="Payment Instruction (shown on invoice)" value={form.payment_instruction}
              onChange={set(tabIdx,'payment_instruction')}
              placeholder="e.g. Please transfer within 7 days. Use invoice number as reference." />
          </div>

          {/* Signature */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-1">Authorised Signature</h2>
            <p className="text-xs text-gray-400 mb-4">Draw your signature. It will appear on every invoice.</p>
            <SignaturePad existing={form.signature} onSave={handleSaveSignature} saving={savingSig} />
            {sigSaved && <p className="text-sm text-green-600 mt-2">✓ Signature saved.</p>}

            {/* Size + position controls */}
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Signature Size — <span className="text-red-600 font-bold">{form.sign_width ?? 72}px</span> tall
                </label>
                <input type="range" min="40" max="140" step="4" className="w-full accent-red-600"
                  value={form.sign_width ?? 72}
                  onChange={e => set(tabIdx, 'sign_width')(parseInt(e.target.value))} />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Small</span><span>Large</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Signature Position on Invoice</label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => set(tabIdx, 'sign_position')(pos)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
                        (form.sign_position || 'right') === pos
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-200 text-gray-600 hover:border-red-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {form.signature && (
                <SignaturePreview
                  sigSrc={form.signature}
                  signWidth={form.sign_width ?? 72}
                  signPosition={form.sign_position || 'right'}
                  businessName={form.name}
                />
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pb-4 flex-wrap">
            <button onClick={() => handleSaveBusiness(tabIdx)} disabled={saving} className="btn-primary disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            {saved    && <span className="text-sm text-green-600 font-medium">✓ Saved successfully</span>}
            {saveErr  && <span className="text-sm text-red-600">{saveErr}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
