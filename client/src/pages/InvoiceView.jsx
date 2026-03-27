import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Printer, Pencil, ArrowLeft, CheckCircle } from 'lucide-react'

const fmt  = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtN = (n) => Number(n || 0).toFixed(2)

const STATUS_STYLE = {
  draft:   { bg: '#F3F4F6', text: '#374151', label: 'DRAFT'   },
  sent:    { bg: '#DBEAFE', text: '#1E40AF', label: 'SENT'    },
  paid:    { bg: '#D1FAE5', text: '#065F46', label: 'PAID'    },
  overdue: { bg: '#FEE2E2', text: '#991B1B', label: 'OVERDUE' },
}

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inv, setInv]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/invoices/${id}`)
      setInv(res.data)
    } finally { setLoading(false) }
  }

  const markPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return
    await axios.put(`/api/invoices/${id}`, { ...inv, status: 'paid' })
    load()
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
  if (!inv) return <div className="p-8 text-gray-500">Invoice not found.</div>

  const ss        = STATUS_STYLE[inv.status] || STATUS_STYLE.draft
  const logoWidth = inv.logo_width ?? 120   // comes from business settings

  return (
    <div className="p-8 max-w-4xl">

      {/* ── Action Bar (hidden on print) ── */}
      <div className="no-print mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
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

      {/* ── Invoice Document ── */}
      <div
        id="invoice-print"
        style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
      >
        {/* Dark header band */}
        <div style={{ background: '#0f172a', padding: '36px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left: logo + business */}
          <div>
            {(inv.business_logo) && (
              <img
                src={inv.business_logo}
                alt="Logo"
                style={{ width: logoWidth, maxWidth: 200, height: 'auto', objectFit: 'contain', marginBottom: 14, display: 'block', filter: 'brightness(0) invert(1)' }}
              />
            )}
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>
              {inv.business_name}
            </div>
            {inv.business_address && (
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {inv.business_address}
              </div>
            )}
            {inv.business_email && (
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{inv.business_email}</div>
            )}
            {inv.business_phone && (
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{inv.business_phone}</div>
            )}
            {inv.business_tax_number && (
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>SSM / Tax: {inv.business_tax_number}</div>
            )}
          </div>

          {/* Right: INVOICE label + number + status */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              Invoice
            </div>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: 0.5 }}>
              {inv.invoice_number}
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{
                background: ss.bg, color: ss.text,
                padding: '4px 14px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase'
              }}>
                {ss.label}
              </span>
            </div>
          </div>
        </div>

        {/* Blue accent line */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' }} />

        {/* Body */}
        <div style={{ padding: '32px 40px' }}>

          {/* Date + Bill To row */}
          <div style={{ display: 'flex', gap: 40, marginBottom: 32 }}>
            {/* Dates */}
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                Invoice Date
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{inv.date}</div>
              {inv.due_date && (
                <>
                  <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>
                    Due Date
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: inv.status === 'overdue' ? '#dc2626' : '#111827' }}>{inv.due_date}</div>
                </>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: '#e5e7eb', flexShrink: 0 }} />

            {/* Bill To */}
            {inv.client_name && (
              <div>
                <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  Bill To
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{inv.client_name}</div>
                {inv.client_company  && <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{inv.client_company}</div>}
                {inv.client_address  && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{inv.client_address}</div>}
                {inv.client_email    && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{inv.client_email}</div>}
                {inv.client_phone    && <div style={{ fontSize: 12, color: '#6b7280' }}>{inv.client_phone}</div>}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ textAlign: 'left',  padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' }}>Description</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', width: 70 }}>Qty</th>
                <th style={{ textAlign: 'right',  padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', width: 120 }}>Unit Price</th>
                <th style={{ textAlign: 'right',  padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', width: 120 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#1f2937' }}>{item.description}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#4b5563', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#4b5563', textAlign: 'right' }}>RM {fmtN(item.unit_price)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>RM {fmtN(item.qty * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
            <div style={{ width: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
                <span>Subtotal</span><span>{fmt(inv.subtotal)}</span>
              </div>
              {inv.tax_rate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Tax ({inv.tax_rate}%)</span><span>{fmt(inv.tax_amount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 16, fontWeight: 800, background: '#0f172a', color: '#fff', borderRadius: 8, marginTop: 8 }}>
                <span>TOTAL</span><span style={{ color: '#60a5fa' }}>{fmt(inv.total)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {(inv.bank_name || inv.bank_account) && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Payment Details
              </div>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {inv.bank_name    && <div><span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Bank</span><span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{inv.bank_name}</span></div>}
                {inv.bank_holder  && <div><span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Account Name</span><span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{inv.bank_holder}</span></div>}
                {inv.bank_account && <div><span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Account Number</span><span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{inv.bank_account}</span></div>}
              </div>
            </div>
          )}

          {/* Payment Instruction */}
          {inv.payment_instruction && (
            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Payment Instruction
              </div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{inv.payment_instruction}</div>
            </div>
          )}

          {/* Notes */}
          {inv.notes && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{inv.notes}</div>
            </div>
          )}

          {/* Signature */}
          {inv.business_signature && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center', minWidth: 180 }}>
                <img
                  src={inv.business_signature}
                  alt="Signature"
                  style={{ height: 60, maxWidth: 220, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                />
                <div style={{ borderTop: '1.5px solid #374151', paddingTop: 6, fontSize: 11, color: '#6b7280', letterSpacing: 0.5 }}>
                  Authorised Signature
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginTop: 3 }}>{inv.business_name}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Thank you for your business.</span>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{inv.invoice_number}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
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
