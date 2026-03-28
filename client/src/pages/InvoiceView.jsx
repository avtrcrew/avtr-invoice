import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Printer, Pencil, ArrowLeft, CheckCircle } from 'lucide-react'

const fmt  = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtN = (n) => Number(n || 0).toFixed(2)

const STATUS_COLOR = {
  draft:   { bg: '#e5e7eb', text: '#374151', label: 'DRAFT' },
  sent:    { bg: '#dbeafe', text: '#1e40af', label: 'SENT' },
  paid:    { bg: '#d1fae5', text: '#065f46', label: 'PAID' },
  overdue: { bg: '#fee2e2', text: '#991b1b', label: 'OVERDUE' },
}

// Thin labeled row for client/company info sections
function LabelVal({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 8.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#111827', fontWeight: 600, lineHeight: 1.4 }}>{value}</div>
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
  if (!inv) return <div className="p-8 text-gray-500">Invoice not found.</div>

  const sc        = STATUS_COLOR[inv.status] || STATUS_COLOR.draft
  const logoW     = inv.logo_width ?? 120
  const signH     = inv.sign_width ?? 72
  const signPos   = inv.sign_position || 'right'
  const sigJust   = signPos === 'left' ? 'flex-start' : signPos === 'center' ? 'center' : 'flex-end'

  return (
    <div className="p-4 md:p-8 max-w-4xl">

      {/* ── Action bar ── */}
      <div className="no-print mb-5 flex items-center gap-3 flex-wrap">
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

      {/* ══════════════════════════ INVOICE DOCUMENT ══════════════════════════ */}
      <div id="invoice-print" style={{
        background: '#ffffff',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>

        {/* ══ HEADER: split red left | white right ══ */}
        <div style={{ display: 'flex', minHeight: 130 }}>

          {/* Left — red panel with logo */}
          <div style={{
            width: '42%', background: '#dc2626',
            padding: '24px 24px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            {inv.business_logo ? (
              <img
                src={inv.business_logo}
                alt="Logo"
                style={{ width: logoW, maxWidth: 200, maxHeight: 80, objectFit: 'contain', display: 'block', marginBottom: 8 }}
              />
            ) : (
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 1, marginBottom: 8 }}>
                {inv.business_name}
              </div>
            )}
            {inv.business_logo && (
              <div style={{ color: '#fecaca', fontSize: 12, fontWeight: 600 }}>{inv.business_name}</div>
            )}
          </div>

          {/* Right — white panel with INVOICE title */}
          <div style={{
            flex: 1, background: '#ffffff',
            padding: '24px 28px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            borderLeft: '4px solid #111827'
          }}>
            <div>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#111827', letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>
                INVOICE
              </div>
              <div style={{ fontSize: 14, color: '#dc2626', fontWeight: 700, marginTop: 6, letterSpacing: 1 }}>
                {inv.invoice_number}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                <span style={{ fontWeight: 600 }}>Date:</span> {inv.date}
                {inv.due_date && <span style={{ marginLeft: 16 }}><span style={{ fontWeight: 600 }}>Due:</span> {inv.due_date}</span>}
              </div>
              <span style={{
                background: sc.bg, color: sc.text,
                padding: '3px 14px', borderRadius: 20,
                fontSize: 10, fontWeight: 800, letterSpacing: 1.5
              }}>{sc.label}</span>
            </div>
          </div>
        </div>

        {/* ══ BILLED TO + COMPANY INFO BAR ══ */}
        <div style={{ display: 'flex', background: '#111827' }}>
          {/* Billed to */}
          <div style={{ width: '42%', padding: '16px 24px', borderRight: '1px solid #374151' }}>
            <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              ▶ Billed To
            </div>
            <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 700 }}>{inv.client_name || '—'}</div>
            {inv.client_company && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{inv.client_company}</div>}
            {inv.client_email   && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{inv.client_email}</div>}
            {inv.client_phone   && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{inv.client_phone}</div>}
          </div>
          {/* Company info */}
          <div style={{ flex: 1, padding: '16px 24px' }}>
            <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              ▶ From
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' }}>
              {inv.business_address && (
                <div style={{ fontSize: 10, color: '#d1d5db', gridColumn: '1/-1', marginBottom: 3 }}>
                  {inv.business_address.replace(/\n/g, ' · ')}
                </div>
              )}
              {inv.business_email   && <div style={{ fontSize: 10, color: '#9ca3af' }}>✉ {inv.business_email}</div>}
              {inv.business_phone   && <div style={{ fontSize: 10, color: '#9ca3af' }}>☎ {inv.business_phone}</div>}
              {inv.business_tax_number && <div style={{ fontSize: 10, color: '#9ca3af' }}>SSM: {inv.business_tax_number}</div>}
            </div>
          </div>
        </div>

        {/* ══ ITEMS TABLE ══ */}
        <div style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1f2937' }}>
                <th style={{ width: 36, padding: '11px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 800, fontSize: 10, letterSpacing: 1 }}>#</th>
                <th style={{ padding: '11px 14px', textAlign: 'left', color: '#f9fafb', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Description</th>
                <th style={{ width: 50, padding: '11px 14px', textAlign: 'center', color: '#f9fafb', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Qty</th>
                <th style={{ width: 100, padding: '11px 14px', textAlign: 'right', color: '#f9fafb', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Unit Price</th>
                <th style={{ width: 110, padding: '11px 14px', textAlign: 'right', color: '#f9fafb', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '11px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 800, fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: '11px 14px', color: '#111827', fontWeight: 500 }}>{item.description}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', color: '#6b7280' }}>{item.qty}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: '#6b7280' }}>{fmtN(item.unit_price)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: '#111827', fontWeight: 700 }}>RM {fmtN(item.qty * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ══ TOTALS + NOTES ══ */}
        <div style={{ display: 'flex', padding: '20px 24px', gap: 20, borderTop: '2px solid #f3f4f6', background: '#fff' }}>

          {/* Left: Notes (if any) */}
          <div style={{ flex: 1 }}>
            {inv.notes && (
              <>
                <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Notes</div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{inv.notes}</p>
              </>
            )}
          </div>

          {/* Right: Totals box */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>RM {fmtN(inv.subtotal)}</span>
              </div>
              {Number(inv.tax_rate) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Tax ({inv.tax_rate}%)</span>
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>RM {fmtN(inv.tax_amount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', background: '#dc2626' }}>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 800, letterSpacing: 1 }}>TOTAL</span>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>{fmt(inv.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ PAYMENT INSTRUCTION ══ */}
        {inv.payment_instruction && (
          <div style={{ margin: '0 24px 20px', padding: '14px 18px', background: '#fff8f8', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>
              ▶ Payment Instruction
            </div>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
              {inv.payment_instruction}
            </p>
          </div>
        )}

        {/* ══ BANK DETAILS (if not in payment instruction) ══ */}
        {(inv.bank_name || inv.bank_account) && (
          <div style={{ display: 'flex', gap: 24, padding: '0 24px 20px' }}>
            {inv.bank_name    && <div><span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }}>Bank</span><span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{inv.bank_name}</span></div>}
            {inv.bank_holder  && <div><span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }}>Account Name</span><span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{inv.bank_holder}</span></div>}
            {inv.bank_account && <div><span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }}>Account No.</span><span style={{ fontSize: 12, color: '#111827', fontWeight: 700, letterSpacing: 0.5 }}>{inv.bank_account}</span></div>}
          </div>
        )}

        {/* ══ SIGNATURE ══ */}
        <div style={{
          padding: '18px 32px 22px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: sigJust,
          background: '#fff'
        }}>
          <div style={{ textAlign: 'center', minWidth: 200, maxWidth: 280 }}>
            {/* Signature image — centered in block */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: signH + 10, marginBottom: 0 }}>
              {inv.business_signature ? (
                <img
                  src={inv.business_signature}
                  alt="Signature"
                  style={{
                    height: signH,
                    maxWidth: 260,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{ width: 200, borderBottom: '1.5px solid #374151' }} />
              )}
            </div>
            {/* Line below signature */}
            <div style={{ width: '100%', borderTop: '1.5px solid #374151', marginTop: 6, paddingTop: 7 }}>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Authorised Signature
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#111827', marginTop: 3 }}>
                {inv.business_name}
              </div>
            </div>
          </div>
        </div>

        {/* ══ THANK YOU ══ */}
        <div style={{
          textAlign: 'center',
          padding: '10px 0 12px',
          fontSize: 11,
          fontWeight: 700,
          color: '#dc2626',
          letterSpacing: 3,
          textTransform: 'uppercase',
          borderTop: '1px solid #f3f4f6',
          background: '#fff'
        }}>
          Thank You For Your Business
        </div>

        {/* ══ FOOTER ══ */}
        <div style={{
          background: '#111827',
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ fontSize: 11, color: '#f9fafb', fontWeight: 700, letterSpacing: 1 }}>
            {inv.business_name}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {inv.business_email && (
              <span style={{ fontSize: 10, color: '#9ca3af' }}>✉ {inv.business_email}</span>
            )}
            {inv.business_phone && (
              <span style={{ fontSize: 10, color: '#9ca3af' }}>☎ {inv.business_phone}</span>
            )}
            {inv.business_address && (
              <span style={{ fontSize: 10, color: '#9ca3af' }}>
                📍 {inv.business_address.replace(/\n/g, ', ')}
              </span>
            )}
          </div>
          <div style={{
            width: 28, height: 28,
            background: '#dc2626', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 0.5
          }}>A</div>
        </div>

      </div>

      {/* Print CSS */}
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
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
