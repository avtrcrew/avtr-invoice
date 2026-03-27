import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)
const dueDefault = () => {
  const d = new Date(); d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

const fmt = (n) => Number(n || 0).toFixed(2)

export default function InvoiceForm() {
  const { currentBusiness } = useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    invoice_number: '',
    client_id: '',
    status: 'draft',
    date: today(),
    due_date: dueDefault(),
    notes: '',
    tax_rate: currentBusiness?.tax_rate || 6,
    items: [{ description: '', qty: 1, unit_price: 0 }]
  })

  useEffect(() => {
    if (!currentBusiness) return
    loadClients()
    if (isEdit) loadInvoice()
    else loadNextNumber()
  }, [currentBusiness, id])

  const loadClients = async () => {
    const res = await axios.get(`/api/clients?business_id=${currentBusiness.id}`)
    setClients(res.data)
  }

  const loadNextNumber = async () => {
    const res = await axios.get(`/api/invoices/next-number/${currentBusiness.id}`)
    setForm(f => ({ ...f, invoice_number: res.data.invoice_number, tax_rate: currentBusiness.tax_rate || 6 }))
  }

  const loadInvoice = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/invoices/${id}`)
      const inv = res.data
      setForm({
        invoice_number: inv.invoice_number,
        client_id: inv.client_id || '',
        status: inv.status,
        date: inv.date,
        due_date: inv.due_date || '',
        notes: inv.notes || '',
        tax_rate: inv.tax_rate || 0,
        items: inv.items.length ? inv.items : [{ description: '', qty: 1, unit_price: 0 }]
      })
    } finally { setLoading(false) }
  }

  const updateItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [field]: field === 'description' ? val : parseFloat(val) || 0 }
      return { ...f, items }
    })
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', qty: 1, unit_price: 0 }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const subtotal = form.items.reduce((s, it) => s + (it.qty * it.unit_price), 0)
  const taxAmt = subtotal * (parseFloat(form.tax_rate) || 0) / 100
  const total = subtotal + taxAmt

  const handleSave = async (statusOverride) => {
    if (!form.invoice_number.trim()) return alert('Invoice number is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        business_id: currentBusiness.id,
        client_id: form.client_id || null,
        status: statusOverride || form.status,
        tax_rate: parseFloat(form.tax_rate) || 0,
        subtotal, tax_amount: taxAmt, total
      }
      if (isEdit) {
        await axios.put(`/api/invoices/${id}`, payload)
      } else {
        const res = await axios.post('/api/invoices', payload)
        navigate(`/invoices/${res.data.id}`)
        return
      }
      navigate(`/invoices/${id}`)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p className="text-sm text-gray-500">{currentBusiness?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main form */}
        <div className="col-span-2 space-y-5">
          {/* Invoice details */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice Number *</label>
                <input className="input" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice Date *</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
                <input type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Bill To</h2>
            <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">— Select client (optional) —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Line Items</h2>
            <div className="space-y-2 mb-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-1 text-right">Amount</span>
                <span className="col-span-1" />
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="input col-span-6"
                    placeholder="Item description"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                  />
                  <input
                    type="number" min="0" step="0.5"
                    className="input col-span-2 text-center"
                    value={item.qty}
                    onChange={e => updateItem(i, 'qty', e.target.value)}
                  />
                  <input
                    type="number" min="0" step="0.01"
                    className="input col-span-2 text-right"
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                  />
                  <span className="col-span-1 text-right text-sm font-medium text-gray-700">
                    {fmt(item.qty * item.unit_price)}
                  </span>
                  <button onClick={() => removeItem(i)} disabled={form.items.length === 1}
                    className="col-span-1 flex justify-center p-1 text-gray-400 hover:text-red-500 transition disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Notes / Terms</h2>
            <textarea
              className="input resize-none h-24"
              placeholder="Thank you for your business. Payment is due within 30 days."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Summary Panel */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">RM {fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="100"
                  className="w-14 text-right text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.tax_rate}
                  onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))}
                />
                <span className="text-gray-400 text-xs">%</span>
              </div>
            </div>
            {form.tax_rate > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax amount</span>
                <span>RM {fmt(taxAmt)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="font-bold text-lg text-blue-600">RM {fmt(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => handleSave()} disabled={saving} className="w-full btn-primary justify-center py-2.5">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Invoice'}
            </button>
            {!isEdit && form.status === 'draft' && (
              <button onClick={() => handleSave('sent')} disabled={saving} className="w-full btn-secondary justify-center py-2.5">
                Save & Mark as Sent
              </button>
            )}
            <button onClick={() => navigate(-1)} className="w-full btn-secondary justify-center py-2.5">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
