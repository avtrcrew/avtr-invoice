import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Printer, Pencil, ArrowLeft, CheckCircle } from 'lucide-react'

const fmt  = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtN = (n) => Number(n || 0).toFixed(2)

const STATUS_STYLE = {
  draft:   { bg: '#F3F4F6', text: '#374151' },
  sent:    { bg: '#FEE2E2', text: '#991B1B' },
  paid:    { bg: '#D1FAE5', text: '#065F46' },
  overdue: { bg: '#FEE2E2', text: '#991B1B' },
}

// ─── Sidebar label+value row ────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  )
}

export default function InvoiceView() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [inv, setInv]         = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    try { const res = await axios.get(`/api/invoices/${id}`); setInv(res.data) }
    finally { setLoading(false) }
  }

  const markPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return
    await axios.put(`/api/invoices/${id}`, { ...inv, status: 'paid' })
    load()
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
  if (!inv)    return <div className="p-8 text-gray-500">Invoice not found.</div>

  const ss        = STATUS_STYLE[inv.status] || STATUS_STYLE.draft
  const logoWidth = inv.logo_width ?? 120

  return (
    <div className="p-8 max-w-4xl">

      {/* ── Action bar ── */}
      <div className="no-print mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
        <span className="flex-1" />
        {inv.status !== 'paid' && (
          <button onClick={markPaid} className="btn-secondary text-green-600 border-green-200 hover:bg-green-50">
            <CheckCircle className="w-4 h-4" /> Mark as Paid
          </button>
        )}
        <button onClick={() => navigate(`/invoices/${id}/edit`)} className="btn-secondary">
          <Pencil className="w-4 h-4" /> Edit
        </button>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          INVOICE DOCUMENT
      ══════════════════════════════════════════════════════ */}
      <div id="invoice-print" style={{ background: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif", border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

        {/* ─── GEOMETRIC HEADER ─── */}
        <div style={{ position: 'relative', height: 130, overflow: 'hidden', background: '#fff' }}>
          <svg
            width="100%" height="130"
            viewBox="0 0 800 130"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            {/* Main dark shape — covers left + center */}
            <polygon points="0,0 580,0 420,130 0,130" fill="#111827" />
            {/* Red diagonal band */}
            <polygon points="500,0 640,0 480,130 340,130" fill="#dc2626" />
            {/* Dark overlay on right */}
            <polygon points="600,0 800,0 800,130 440,130" fill="#111827" />
            {/* Small red accent top-right */}
            <polygon points="730,0 800,0 800,50" fill="#dc2626" opacity="0.7" />
          </svg>

          {/* Logo — white background box so it always shows */}
          <div style={{ position: 'absolute', top: 20, left: 30, zIndex: 2 }}>
            {inv.business_logo ? (
              <div style={{ background: '#fff', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                <img
                  src={inv.business_logo}
                  alt="Logo"
                  style={{ height: logoWidth * 0.4, maxHeight: 56, maxWidth: 160, objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>
                {inv.business_name}
              </div>
            )}
            {inv.business_logo && (
              <div style={{ color: '#e5e7eb', fontSize: 11, marginTop: 6, fontWeight: 600 }}>{inv.business_name}</div>
            )}
          </div>

          {/* INVOICE + status top-right */}
          <div style={{ position: 'absolute', right: 28, top: 22, zIndex: 2, textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: 5, textTransform: 'uppercase', lineHeight: 1 }}>
              INVOICE
            </div>
            <div style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
              {inv.invoice_number}
            </div>
            <span style={{
              background: ss.bg, color: ss.text,
              padding: '2px 12px', borderRadius: 20,
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
              display: 'inline-block', marginTop: 6
            }}>
              {inv.status}
            </span>
          </div>
        </div>

        {/* ─── CLIENT INFO BAR ─── */}
        <div style={{ display: 'flex', borderBottom: '3px solid #dc2626', background: '#f9fafb' }}>
          {[
            { label: "Client's Name", value: inv.client_name || '—' },
            { label: "Client's Company", value: inv.client_company || '—' },
            { label: 'Date', value: inv.date },
            { label: 'Due Date', value: inv.due_date || '—' },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 16px',
              borderRight: i < 3 ? '1px solid #dc2626' : 'none'
            }}>
              <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.8 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 3 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* ─── BODY: sidebar + table ─── */}
        <div style={{ display: 'flex', minHeight: 300 }}>

          {/* LEFT sidebar — business info */}
          <div style={{ width: 160, flexShrink: 0, background: '#f3f4f6', borderRight: '1px solid #e5e7eb', padding: '20px 14px' }}>
            <InfoRow label="Address"      value={inv.business_address} />
            <InfoRow label="Email"        value={inv.business_email} />
            <InfoRow label="Phone"        value={inv.business_phone} />
            <InfoRow label="Tax / SSM"    value={inv.business_tax_number} />
            {inv.bank_name    && <InfoRow label="Bank"         value={inv.bank_name} />}
            {inv.bank_holder  && <InfoRow label="Account Name" value={inv.bank_holder} />}
            {inv.bank_account && <InfoRow label="Account No."  value={inv.bank_account} />}
          </div>

          {/* RIGHT — items table + totals */}
          <div style={{ flex: 1, padding: '20px 20px 0' }}>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#111827' }}>
                  <th style={{ color: '#9ca3af', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px', textAlign: 'center', width: 32 }}>SL</th>
                  <th style={{ color: '#9ca3af', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px', textAlign: 'left' }}>Description</th>
                  <th style={{ color: '#9ca3af', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px', textAlign: 'center', width: 46 }}>Unit</th>
                  <th style={{ color: '#9ca3af', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px', textAlign: 'right', width: 80 }}>Rate</th>
                  <th style={{ color: '#9ca3af', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px', textAlign: 'right', width: 90 }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 1 ? '#f9fafb' : '#fff' }}>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#dc2626', fontWeight: 700, fontSize: 11 }}>#{i + 1}</td>
                    <td style={{ padding: '9px 10px', color: '#1f2937', fontWeight: 600 }}>
                      {item.description}
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#6b7280' }}>{item.qty}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#6b7280' }}>RM {fmtN(item.unit_price)}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#111827', fontWeight: 700 }}>RM {fmtN(item.qty * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes + Totals row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 20 }}>
              {/* Notes / Terms */}
              <div style={{ flex: 1 }}>
                {(inv.notes || inv.payment_instruction) && (
                  <>
                    <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                      Terms &amp; Conditions / Notes:
                    </div>
                    {inv.payment_instruction && (
                      <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, marginBottom: 4, whiteSpace: 'pre-line' }}>{inv.payment_instruction}</p>
                    )}
                    {inv.notes && (
                      <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{inv.notes}</p>
                    )}
                  </>
                )}
              </div>

              {/* Totals */}
              <div style={{ width: 200, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Subtotal</span><span>RM {fmtN(inv.subtotal)}</span>
                </div>
                {inv.tax_rate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
                    <span>Tax ({inv.tax_rate}%)</span><span>RM {fmtN(inv.tax_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', fontSize: 14, fontWeight: 800, background: '#dc2626', color: '#fff', borderRadius: 6, marginTop: 8 }}>
                  <span>Total</span><span>{fmt(inv.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SIGNATURE SECTION ─── */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Company signature */}
          <div style={{ textAlign: 'center', minWidth: 200 }}>
            {inv.business_signature ? (
              <img
                src={inv.business_signature}
                alt="Signature"
                style={{ height: 64, maxWidth: 220, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
              />
            ) : (
              <div style={{ height: 60, borderBottom: '1.5px solid #374151', marginBottom: 4 }} />
            )}
            <div style={{ borderTop: inv.business_signature ? '1.5px solid #374151' : 'none', paddingTop: 6, fontSize: 11, color: '#6b7280' }}>
              Company Signature
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginTop: 2 }}>{inv.business_name}</div>
          </div>

          {/* Client signature (blank line for manual signing) */}
          <div style={{ textAlign: 'center', minWidth: 200 }}>
            <div style={{ height: 64, borderBottom: '1.5px dashed #d1d5db', marginBottom: 4 }} />
            <div style={{ paddingTop: 6, fontSize: 11, color: '#6b7280' }}>Client Signature</div>
            {inv.client_name && <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginTop: 2 }}>{inv.client_name}</div>}
          </div>
        </div>

        {/* ─── THANK YOU ─── */}
        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, fontWeight: 700, color: '#dc2626', letterSpacing: 2, textTransform: 'uppercase' }}>
          Thank You For Your Business
        </div>

        {/* ─── FOOTER BAR ─── */}
        <div style={{ background: '#111827', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {inv.business_address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, background: '#dc2626', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10 }}>📍</span>
              </div>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>{inv.business_address.replace(/\n/g, ', ')}</span>
            </div>
          )}
          {inv.business_email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, background: '#dc2626', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10 }}>✉</span>
              </div>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>{inv.business_email}</span>
            </div>
          )}
          {inv.business_phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, background: '#dc2626', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10 }}>📞</span>
              </div>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>{inv.business_phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Print styles — force background colors + full page */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: fixed !important;
            top: 0; left: 0;
            width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
