import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Printer, Pencil, ArrowLeft, CheckCircle } from 'lucide-react'

const fmt  = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtN = (n) => Number(n || 0).toFixed(2)

const STATUS_STYLE = {
  draft:   { bg: 'rgba(255,255,255,0.15)', text: '#ffffff', label: 'DRAFT' },
  sent:    { bg: 'rgba(255,255,255,0.15)', text: '#ffffff', label: 'SENT' },
  paid:    { bg: 'rgba(255,255,255,0.25)', text: '#ffffff', label: 'PAID' },
  overdue: { bg: 'rgba(0,0,0,0.25)',       text: '#ffffff', label: 'OVERDUE' },
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

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
    </div>
  )
  if (!inv) return <div className="p-8 text-gray-500">Invoice not found.</div>

  const ss      = STATUS_STYLE[inv.status] || STATUS_STYLE.draft
  const logoW   = Number(inv.logo_width ?? 120)   // actual pixel width of logo image
  const signH   = Number(inv.sign_width  ?? 72)
  const signPos = inv.sign_position || 'right'
  const sigJust = signPos === 'left' ? 'flex-start' : signPos === 'center' ? 'center' : 'flex-end'

  return (
    <div className="p-4 md:p-8 max-w-4xl">

      {/* ── Action bar (hidden on print) ── */}
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

      {/* ═══════════════════════════════════════════
          INVOICE DOCUMENT
      ═══════════════════════════════════════════ */}
      <div id="invoice-print" style={{
        background: '#ffffff',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>

        {/* ══ RED HEADER ══ */}
        <div style={{
          background: '#dc2626',
          padding: '28px 32px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16
        }}>

          {/* LEFT: Logo image, then business name directly below it */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
            {inv.business_logo ? (
              <>
                {/*
                  width = logoW (from slider).
                  height = auto so it scales proportionally — no distortion.
                  alignSelf: flex-start so flexbox does not stretch it.
                */}
                <img
                  src={inv.business_logo}
                  alt="Logo"
                  style={{
                    width: logoW,
                    height: 'auto',
                    maxHeight: 100,
                    objectFit: 'contain',
                    display: 'block',
                    alignSelf: 'flex-start'
                  }}
                />
                {/* Business name hugs directly below the logo */}
                <div style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 8,
                  letterSpacing: 0.3,
                  lineHeight: 1.3
                }}>
                  {inv.business_name}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5 }}>
                {inv.business_name}
              </div>
            )}
          </div>

          {/* RIGHT: INVOICE title, number, status */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#ffffff', letterSpacing: 6, lineHeight: 1, textTransform: 'uppercase' }}>
              INVOICE
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginTop: 7, letterSpacing: 0.5 }}>
              {inv.invoice_number}
            </div>
            <span style={{
              display: 'inline-block', marginTop: 10,
              background: ss.bg, color: ss.text,
              border: '1px solid rgba(255,255,255,0.35)',
              padding: '3px 16px', borderRadius: 20,
              fontSize: 10, fontWeight: 800, letterSpacing: 1.5
            }}>{ss.label}</span>
          </div>
        </div>

        {/* ══ DATE STRIP — darker red ══ */}
        <div style={{ background: '#b91c1c', padding: '9px 32px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Invoice Date: <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>{inv.date || '—'}</span>
          </span>
          {inv.due_date && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              Due Date: <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>{inv.due_date}</span>
            </span>
          )}
        </div>

        {/* ══ BILL TO / FROM — white with red accents ══ */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', background: '#fff' }}>

          <div style={{ flex: 1, padding: '22px 32px', borderRight: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 2, borderBottom: '2px solid #dc2626', paddingBottom: 5, marginBottom: 12, display: 'inline-block' }}>
              Bill To
            </div>
            <div style={{ fontSize: 14, color: '#111827', fontWeight: 800, marginBottom: 4 }}>{inv.client_name || '—'}</div>
            {inv.client_company && <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 4 }}>{inv.client_company}</div>}
            {inv.client_address && <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, marginBottom: 4, whiteSpace: 'pre-line' }}>{inv.client_address}</div>}
            {inv.client_email   && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>✉ {inv.client_email}</div>}
            {inv.client_phone   && <div style={{ fontSize: 11, color: '#6b7280' }}>☎ {inv.client_phone}</div>}
          </div>

          <div style={{ flex: 1, padding: '22px 32px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 2, borderBottom: '2px solid #dc2626', paddingBottom: 5, marginBottom: 12, display: 'inline-block' }}>
              From
            </div>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 800, marginBottom: 4 }}>{inv.business_name}</div>
            {inv.business_address    && <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, marginBottom: 4, whiteSpace: 'pre-line' }}>{inv.business_address}</div>}
            {inv.business_email      && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>✉ {inv.business_email}</div>}
            {inv.business_phone      && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>☎ {inv.business_phone}</div>}
            {inv.business_tax_number && <div style={{ fontSize: 11, color: '#6b7280' }}>SSM: {inv.business_tax_number}</div>}
          </div>
        </div>

        {/* ══ ITEMS TABLE ══ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#dc2626' }}>
              <th style={{ width: 40,  padding: '12px 14px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>#</th>
              <th style={{             padding: '12px 14px', textAlign: 'left',   color: '#fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Description</th>
              <th style={{ width: 60,  padding: '12px 14px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Qty</th>
              <th style={{ width: 110, padding: '12px 14px', textAlign: 'right',  color: '#fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Unit Price</th>
              <th style={{ width: 120, padding: '12px 14px', textAlign: 'right',  color: '#fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Amount (RM)</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#ffffff' : '#fff5f5' }}>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 800 }}>{i + 1}</td>
                <td style={{ padding: '12px 14px', color: '#111827', fontWeight: 500, lineHeight: 1.5 }}>{item.description}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#374151' }}>{item.qty}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right',  color: '#374151' }}>{fmtN(item.unit_price)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right',  color: '#111827', fontWeight: 700 }}>{fmtN(item.qty * item.unit_price)}</td>
              </tr>
            ))}
            {/* Pad to at least 3 rows */}
            {inv.items.length < 3 && Array.from({ length: 3 - inv.items.length }).map((_, i) => (
              <tr key={`pad-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px' }}>&nbsp;</td>
                <td colSpan={4} style={{ padding: '12px 14px' }} />
              </tr>
            ))}
          </tbody>
        </table>

        {/* ══ TOTALS + NOTES ══ */}
        <div style={{ display: 'flex', padding: '24px 32px', gap: 24, borderTop: '2px solid #f3f4f6', background: '#fff' }}>

          <div style={{ flex: 1 }}>
            {inv.notes && (
              <>
                <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '2px solid #dc2626', paddingBottom: 4, marginBottom: 10, display: 'inline-block' }}>
                  Notes
                </div>
                <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>{inv.notes}</p>
              </>
            )}
          </div>

          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Subtotal</span>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 700 }}>RM {fmtN(inv.subtotal)}</span>
              </div>
              {Number(inv.tax_rate) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Tax ({inv.tax_rate}%)</span>
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 700 }}>RM {fmtN(inv.tax_amount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#dc2626' }}>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontSize: 16, color: '#fff', fontWeight: 900 }}>{fmt(inv.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ PAYMENT INSTRUCTION ══ */}
        {inv.payment_instruction && (
          <div style={{ margin: '0 32px 24px', padding: '16px 20px', background: '#fff8f8', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Payment Instructions
            </div>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
              {inv.payment_instruction}
            </p>
          </div>
        )}

        {/* ══ BANK DETAILS ══ */}
        {(inv.bank_name || inv.bank_account) && (
          <div style={{ display: 'flex', gap: 28, padding: '0 32px 24px', flexWrap: 'wrap' }}>
            {inv.bank_name    && <div><span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }}>Bank</span><span style={{ fontSize: 12, color: '#111827', fontWeight: 700 }}>{inv.bank_name}</span></div>}
            {inv.bank_holder  && <div><span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }}>Account Name</span><span style={{ fontSize: 12, color: '#111827', fontWeight: 700 }}>{inv.bank_holder}</span></div>}
            {inv.bank_account && <div><span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }}>Account No.</span><span style={{ fontSize: 12, color: '#111827', fontWeight: 800, letterSpacing: 0.5 }}>{inv.bank_account}</span></div>}
          </div>
        )}

        {/* ══ SIGNATURE ══ */}
        <div style={{
          padding: '22px 32px 30px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: sigJust,
          background: '#fff'
        }}>
          <div style={{ textAlign: 'center', minWidth: 200, maxWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: signH + 10 }}>
              {inv.business_signature ? (
                <img
                  src={inv.business_signature}
                  alt="Signature"
                  style={{ height: signH, maxWidth: 260, objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ width: 200, borderBottom: '1.5px solid #9ca3af' }} />
              )}
            </div>
            <div style={{ borderTop: '1.5px solid #374151', marginTop: 6, paddingTop: 8 }}>
              <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Authorised Signature
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#111827', marginTop: 4 }}>
                {inv.business_name}
              </div>
            </div>
          </div>
        </div>

        {/* ══ THANK YOU ══ */}
        <div style={{
          textAlign: 'center', padding: '10px 0 12px',
          fontSize: 11, fontWeight: 700, color: '#dc2626',
          letterSpacing: 3, textTransform: 'uppercase',
          borderTop: '1px solid #f3f4f6', background: '#fff'
        }}>
          Thank You For Your Business
        </div>

        {/* ══ FOOTER — red bar ══ */}
        <div style={{
          background: '#dc2626', padding: '13px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 800, letterSpacing: 1 }}>{inv.business_name}</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {inv.business_email && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>✉ {inv.business_email}</span>}
            {inv.business_phone && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>☎ {inv.business_phone}</span>}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{inv.invoice_number}</div>
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
