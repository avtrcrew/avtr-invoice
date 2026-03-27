import { useEffect, useState } from 'react'
import { useApp } from '../App'
import axios from 'axios'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import Modal from '../components/Modal'

const fmt = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const INCOME_CATS = ['Invoice Payment', 'Cash Sale', 'Deposit', 'Other Income']
const EXPENSE_CATS = ['Rent', 'Utilities', 'Salary', 'Materials', 'Software', 'Transport', 'Marketing', 'Office', 'Tax', 'Other Expense']

const EMPTY = { type: 'income', category: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' }

export default function Transactions() {
  const { currentBusiness } = useApp()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { if (currentBusiness) load() }, [currentBusiness])

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/transactions?business_id=${currentBusiness.id}`)
      setTransactions(res.data)
    } finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) }); setModal(true) }
  const openEdit = (tx) => { setEditing(tx); setForm({ type: tx.type, category: tx.category || '', amount: tx.amount, date: tx.date, description: tx.description || '' }); setModal(true) }

  const handleSave = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`/api/transactions/${editing.id}`, { ...form, business_id: currentBusiness.id })
      } else {
        await axios.post('/api/transactions', { ...form, business_id: currentBusiness.id })
      }
      setModal(false)
      load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (tx) => {
    if (!confirm('Delete this transaction?')) return
    await axios.delete(`/api/transactions/${tx.id}`)
    load()
  }

  const filtered = transactions.filter(tx => filter === 'all' || tx.type === filter)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const categories = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentBusiness?.name}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Income</p>
            <p className="font-bold text-green-600">{fmt(totalIncome)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Expenses</p>
            <p className="font-bold text-red-500">{fmt(totalExpense)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
            <span className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-500'}`}>≈</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Net</p>
            <p className={`font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{fmt(totalIncome - totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4">
        {['all', 'income', 'expense'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>{f}</button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-gray-400 text-sm">No transactions yet</p>
            <button onClick={openNew} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Add one</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Description</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Type</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3.5 text-gray-500">{tx.date}</td>
                  <td className="px-5 py-3.5 text-gray-800">{tx.description || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{tx.category || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge capitalize ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(tx)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Transaction' : 'Add Transaction'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['income', 'expense'].map(t => (
                <button key={t}
                  onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
                  className={`py-2.5 rounded-xl text-sm font-medium capitalize border transition ${form.type === t ? (t === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (RM) *</label>
            <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date *</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">— Select category —</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <input className="input" placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !form.amount || !form.date} className="flex-1 btn-primary justify-center py-2.5 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update' : 'Add Transaction'}
            </button>
            <button onClick={() => setModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
