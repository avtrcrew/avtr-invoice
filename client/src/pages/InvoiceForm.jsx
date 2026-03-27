import { useEffect, useState, useRef } from 'react'
import { useApp } from '../App'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Plus, Trash2, Save, ArrowLeft, UserPlus, ChevronDown, Bookmark, X } from 'lucide-react'

const today     = () => new Date().toISOString().slice(0, 10)
const dueDefault = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10) }
const fmtNum    = (n) => Number(n || 0).toFixed(2)

const EMPTY_CLIENT = { name: '', company: '', email: '', phone: '', address: '' }

export default function InvoiceForm() {
  const { currentBusiness } = useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  // ── Core state ───────────────────────────────────────────────────────────────
  const [clients, setClients]     = useState([])
  const [catalog, setCatalog]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)

  // ── Invoice form ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    invoice_number: '',
    client_id: '',
    status: 'draft',
    date: today(),
    due_date: dueDefault(),
    notes: '',
    tax_rate: 6,
    items: [{ description: '', qty: 1, unit_price: 0 }]
  })

  // ── Inline new client ────────────────────────────────────────────────────────
  const [showNewClient, setShowNewClient]   = useState(false)
  const [newClient, setNewClient]           = useState(EMPTY_CLIENT)
  const [savingClient, setSavingClient]     = useState(false)
  const [clientErr, setClientErr]           = useState('')

  // ── Catalog autocomplete ─────────────────────────────────────────────────────
  const [openCatalogIdx, setOpenCatalogIdx] = useState(null)   // which item row is open
  const [catalogFilter, setCatalogFilter]   = useState('')
  const catalogRef = useRef(null)

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentBusiness) return
    loadClients()
    loadCatalog()
    if (isEdit) loadInvoice()
    else loadNextNumber()
  }, [currentBusiness, id])

  // Close catalog dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (catalogRef.current && !catalogRef.current.contains(e.target)) setOpenCatalogIdx(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadClients = async () => {
    const res = await axios.get(`/api/clients?business_id=${currentBusiness.id}`)
    setClients(res.data)
  }

  const loadCatalog = async () => {
    const res = await axios.get(`/api/catalog?business_id=${currentBusiness.id}`)
    setCatalog(res.data)
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
        client_id:      inv.client_id || '',
        status:         inv.status,
        date:           inv.date,
        due_date:       inv.due_date || '',
        notes:          inv.notes || '',
        tax_rate:       inv.tax_rate || 0,
        items:          inv.items.length ? inv.items : [{ description: '', qty: 1, unit_price: 0 }]
      })
    } finally { setLoading(false) }
  }

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const updateItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [field]: field === 'description' ? val : (parseFloat(val) || 0) }
      return { ...f, items }
    })
  }
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { description: '', qty: 1, unit_price: 0 }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  // Pick catalog item into a row
  const pickCatalog = (i, item) => {
    updateItem(i, 'description', item.name)
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], description: item.name, unit_price: item.unit_price }
      return { ...f, items }
    })
    setOpenCatalogIdx(null)
    setCatalogFilter('')
  }

  // Save current item to catalog
  const saveItemToCatalog = async (i) => {
    const item = form.items[i]
    if (!item.description.trim()) return
    await axios.post('/api/catalog', {
      business_id: currentBusiness.id,
      name: item.description,
      unit_price: item.unit_price
    })
    await loadCatalog()
  }

  // ── Inline client save ───────────────────────────────────────────────────────
  const handleSaveNewClient = async () => {
    setClientErr('')
    if (!newClient.name.trim()) { setClientErr('Name is required'); return }
    setSavingClient(true)
    try {
      const res = await axios.post('/api/clients', { ...newClient, business_id: currentBusiness.id })
      await loadClients()
      setForm(f => ({ ...f, client_id: String(res.data.id) }))
      setShowNewClient(false)
      setNewClient(EMPTY_CLIENT)
    } catch { setClientErr('Failed to save client') }
    finally { setSavingClient(false) }
  }

  // ── Totals ───────────────────────────────────────────────────────────────────
  const subtotal = form.items.reduce((s, it) => s + it.qty * it.unit_price, 0)
  const taxAmt   = subtotal * (parseFloat(form.tax_rate) || 0) / 100
  const total    = subtotal + taxAmt

  // ── Save invoice ─────────────────────────────────────────────────────────────
  const handleSave = async (statusOverride) => {
    if (!form.invoice_number.trim()) return alert('Invoice number is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        business_id: currentBusiness.id,
        client_id:   form.client_id || null,
        status:      statusOverride || form.status,
        tax_rate:    parseFloat(form.tax_rate) || 0,
        subtotal, tax_amount: taxAmt, total
      }
      if (isEdit) {
        await axios.put(`/api/invoices/${id}`, payload)
        navigate(`/invoices/${id}`)
      } else {
        const res = await axios.post('/api/invoices', payload)
        navigate(`/invoices/${res.data.id}`)
      }
    } finally { setSaving(false) }
  }

  // ── Catalog dropdown items ───────────────────────────────────────────────────
  const filteredCatalog = (filter) =>
    catalog.filter(c => !filter || c.name.toLowerCase().includes(filter.toLowerCase()))

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p className="text-sm text-gray-500">{currentBusiness?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="col-span-2 space-y-5">

          {/* Invoice details */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice Number *</label>
                <input className="input" value={form.invoice_number}
                  onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                <select className="input" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice Date *</label>
                <input type="date" className="input" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
                <input type="date" className="input" value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ── Bill To ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Bill To</h2>
              <button
                onClick={() => { setShowNewClient(s => !s); setClientErr('') }}
                className={`btn-secondary text-xs py-1.5 ${showNewClient ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showNewClient ? 'Cancel new client' : 'Add new client'}
              </button>
            </div>

            {/* Select existing */}
            {!showNewClient && (
              <select className="input" value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">— Select existing client (optional) —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` · ${c.company}` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Inline new client form */}
            {showNewClient && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">New Client Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input className="input bg-white" placeholder="Ahmad bin Ali" value={newClient.name}
                      onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                    <input className="input bg-white" placeholder="Syarikat ABC Sdn Bhd" value={newClient.company}
                      onChange={e => setNewClient(c => ({ ...c, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" className="input bg-white" placeholder="ahmad@abc.com" value={newClient.email}
                      onChange={e => setNewClient(c => ({ ...c, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input className="input bg-white" placeholder="+60 12-345 6789" value={newClient.phone}
                      onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea className="input bg-white resize-none h-16" placeholder="No. 1, Jalan Utama, Kuala Lumpur"
                    value={newClient.address} onChange={e => setNewClient(c => ({ ...c, address: e.target.value }))} />
                </div>
                {clientErr && <p className="text-xs text-red-600">{clientErr}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSaveNewClient} disabled={savingClient || !newClient.name.trim()}
                    className="btn-primary text-xs py-1.5 disabled:opacity-50">
                    {savingClient ? 'Saving…' : 'Save & Select Client'}
                  </button>
                  <button onClick={() => { setShowNewClient(false); setNewClient(EMPTY_CLIENT) }}
                    className="btn-secondary text-xs py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Line Items ── */}
          <div className="card p-5" ref={catalogRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Line Items</h2>
              {catalog.length > 0 && (
                <span className="text-xs text-gray-400">{catalog.length} item{catalog.length > 1 ? 's' : ''} in catalog</span>
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1 mb-2">
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2 mb-3">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  {/* Description with catalog dropdown */}
                  <div className="col-span-5 relative">
                    <div className="flex gap-1">
                      <div className="relative flex-1">
                        <input
                          className="input pr-8"
                          placeholder="Item description"
                          value={item.description}
                          onChange={e => {
                            updateItem(i, 'description', e.target.value)
                            setCatalogFilter(e.target.value)
                            setOpenCatalogIdx(i)
                          }}
                          onFocus={() => { setOpenCatalogIdx(i); setCatalogFilter(item.description) }}
                        />
                        {catalog.length > 0 && (
                          <button
                            type="button"
                            onClick={() => { setOpenCatalogIdx(openCatalogIdx === i ? null : i); setCatalogFilter('') }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition"
                            title="Browse catalog"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {/* Save to catalog button */}
                      <button
                        type="button"
                        onClick={() => saveItemToCatalog(i)}
                        disabled={!item.description.trim()}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 text-gray-400 transition disabled:opacity-30"
                        title="Save to item catalog"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Catalog dropdown */}
                    {openCatalogIdx === i && filteredCatalog(catalogFilter).length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                        {filteredCatalog(catalogFilter).map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onMouseDown={() => pickCatalog(i, cat)}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition flex items-center justify-between group"
                          >
                            <span className="text-sm text-gray-800 font-medium">{cat.name}</span>
                            <span className="text-xs text-gray-500 group-hover:text-blue-600">RM {fmtNum(cat.unit_price)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input type="number" min="0" step="0.5" className="input col-span-2 text-center"
                    value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />

                  <input type="number" min="0" step="0.01" className="input col-span-2 text-right"
                    value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />

                  <span className="col-span-2 text-right text-sm font-medium text-gray-700">
                    {fmtNum(item.qty * item.unit_price)}
                  </span>

                  <button onClick={() => removeItem(i)} disabled={form.items.length === 1}
                    className="col-span-1 flex justify-center p-1.5 text-gray-400 hover:text-red-500 transition disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={addItem} className="btn-secondary text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
              {catalog.length === 0 && (
                <p className="text-xs text-gray-400">
                  Tip: click <Bookmark className="inline w-3 h-3" /> to save an item to your catalog for reuse
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Notes / Terms</h2>
            <textarea className="input resize-none h-24"
              placeholder="Thank you for your business. Payment is due within 30 days."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        {/* ── Right column — Summary + Actions ── */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">RM {fmtNum(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min="0" max="100"
                  className="w-14 text-right text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.tax_rate}
                  onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} />
                <span className="text-gray-400 text-xs">%</span>
              </div>
            </div>
            {form.tax_rate > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax amount</span>
                <span>RM {fmtNum(taxAmt)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="font-bold text-lg text-blue-600">RM {fmtNum(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => handleSave()} disabled={saving}
              className="w-full btn-primary justify-center py-2.5">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Invoice'}
            </button>
            {!isEdit && form.status === 'draft' && (
              <button onClick={() => handleSave('sent')} disabled={saving}
                className="w-full btn-secondary justify-center py-2.5">
                Save & Mark as Sent
              </button>
            )}
            <button onClick={() => navigate(-1)} className="w-full btn-secondary justify-center py-2.5">
              Cancel
            </button>
          </div>

          {/* Catalog quick view */}
          {catalog.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" /> Item Catalog
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {catalog.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between text-xs text-gray-600 py-1 border-b border-gray-50 last:border-0">
                    <span className="truncate flex-1 mr-2">{cat.name}</span>
                    <span className="text-gray-400 flex-shrink-0">RM {fmtNum(cat.unit_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
