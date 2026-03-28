import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Search, Eye, Pencil, Trash2, CheckCircle } from 'lucide-react'

const STATUS_BADGE = {
  draft:   'bg-gray-100 text-gray-600',
  sent:    'bg-red-100 text-red-700',
  paid:    'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

const fmt = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Invoices() {
  const { currentBusiness } = useApp()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentBusiness) return
    load()
  }, [currentBusiness])

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/invoices?business_id=${currentBusiness.id}`)
      setInvoices(res.data)
    } finally { setLoading(false) }
  }

  const markPaid = async (inv) => {
    if (!confirm(`Mark ${inv.invoice_number} as paid?`)) return
    const today = new Date().toISOString().slice(0, 10)
    await axios.put(`/api/invoices/${inv.id}`, { ...inv, status: 'paid', date: today })
    load()
  }

  const deleteInvoice = async (inv) => {
    if (!confirm(`Delete ${inv.invoice_number}? This cannot be undone.`)) return
    await axios.delete(`/api/invoices/${inv.id}`)
    load()
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_name || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.status === filter
    return matchSearch && matchFilter
  })

  const statuses = ['all', 'draft', 'sent', 'paid', 'overdue']

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentBusiness?.name}</p>
        </div>
        <button onClick={() => navigate('/invoices/new')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search invoices…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filter === s ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-red-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No invoices found</p>
            <button onClick={() => navigate('/invoices/new')} className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> Create your first invoice
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Client</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Due</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3.5 font-medium text-red-600 cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    {inv.invoice_number}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    <div>{inv.client_name || <span className="text-gray-400">No client</span>}</div>
                    {inv.client_company && <div className="text-xs text-gray-400">{inv.client_company}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{inv.date}</td>
                  <td className="px-5 py-3.5 text-gray-500">{inv.due_date || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge capitalize ${STATUS_BADGE[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmt(inv.total)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/invoices/${inv.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => navigate(`/invoices/${inv.id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {inv.status !== 'paid' && (
                        <button onClick={() => markPaid(inv)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition" title="Mark paid">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteInvoice(inv)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
