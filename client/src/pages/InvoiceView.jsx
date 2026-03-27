import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Printer, Pencil, ArrowLeft, CheckCircle } from 'lucide-react'

const fmt = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtNum = (n) => Number(n || 0).toFixed(2)

const STATUS_COLORS = {
  draft:   { bg: '#F3F4F6', text: '#4B5563' },
  sent:    { bg: '#DBEAFE', text: '#1D4ED8' },
  paid:    { bg: '#D1FAE5', text: '#065F46' },
  overdue: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inv, setInv] = useState(null)
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
    const today = new Date().toISOString().slice(0, 10)
    await axios.put(`/api/invoices/${id}`, { ...inv, status: 'paid', date: inv.date })
    load()
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  if (!inv) return <div className="p-8 text-gray-500">Invoice not found.</div>

  const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.draft

  return (
    <div className="p-8 max-w-4xl">
      {/* Actions bar */}
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

      {/* Invoice Document */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10" id="invoice-print">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            {inv.business_logo && (
              <img src={inv.business_logo} alt="Logo" className="h-14 mb-3 object-contain" />
            )}
            <h2 className="text-xl font-bold text-gray-900">{inv.business_name}</h2>
            {inv.business_address && <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-line">{inv.business_address}</p>}
            {inv.business_email && <p className="text-sm text-gray-500">{inv.business_email}</p>}
            {inv.business_phone && <p className="text-sm text-gray-500">{inv.business_phone}</p>}
            {inv.business_tax_number && <p className="text-sm text-gray-500">SSM/Tax: {inv.business_tax_number}</p>}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 mb-1">INVOICE</div>
            <div className="text-lg font-semibold text-blue-600">{inv.invoice_number}</div>
            <div className="mt-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase"
                style={{ backgroundColor: sc.bg, color: sc.text }}
              >
                {inv.status}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Invoice Date</p>
            <p className="text-sm font-medium text-gray-800">{inv.date}</p>
          </div>
          {inv.due_date && (
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Due Date</p>
              <p className="text-sm font-medium text-gray-800">{inv.due_date}</p>
            </div>
          )}
        </div>

        {/* Bill To */}
        {inv.client_name && (
          <div className="mb-8 bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Bill To</p>
            <p className="font-semibold text-gray-900">{inv.client_name}</p>
            {inv.client_company && <p className="text-sm text-gray-600">{inv.client_company}</p>}
            {inv.client_address && <p className="text-sm text-gray-500 whitespace-pre-line">{inv.client_address}</p>}
            {inv.client_email && <p className="text-sm text-gray-500">{inv.client_email}</p>}
            {inv.client_phone && <p className="text-sm text-gray-500">{inv.client_phone}</p>}
          </div>
        )}

        {/* Line Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-3 text-gray-800">{item.description}</td>
                <td className="py-3 text-center text-gray-600">{item.qty}</td>
                <td className="py-3 text-right text-gray-600">RM {fmtNum(item.unit_price)}</td>
                <td className="py-3 text-right font-medium text-gray-800">RM {fmtNum(item.qty * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{fmt(inv.subtotal)}</span>
            </div>
            {inv.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({inv.tax_rate}%)</span>
                <span>{fmt(inv.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
              <span>Total</span>
              <span className="text-blue-600">{fmt(inv.total)}</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {(inv.bank_name || inv.bank_account) && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-700 font-semibold uppercase mb-2">Payment Details</p>
            {inv.bank_name && <p className="text-sm text-gray-700"><span className="font-medium">Bank:</span> {inv.bank_name}</p>}
            {inv.bank_holder && <p className="text-sm text-gray-700"><span className="font-medium">Account Name:</span> {inv.bank_holder}</p>}
            {inv.bank_account && <p className="text-sm text-gray-700"><span className="font-medium">Account No:</span> {inv.bank_account}</p>}
          </div>
        )}

        {/* Notes */}
        {inv.notes && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{inv.notes}</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
