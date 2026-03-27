import { useEffect, useState } from 'react'
import { useApp } from '../App'
import axios from 'axios'
import { Plus, Pencil, Trash2, User, Search } from 'lucide-react'
import Modal from '../components/Modal'

const EMPTY = { name: '', company: '', email: '', phone: '', address: '' }

export default function Clients() {
  const { currentBusiness } = useApp()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (currentBusiness) load() }, [currentBusiness])

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/clients?business_id=${currentBusiness.id}`)
      setClients(res.data)
    } finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, company: c.company || '', email: c.email || '', phone: c.phone || '', address: c.address || '' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`/api/clients/${editing.id}`, { ...form, business_id: currentBusiness.id })
      } else {
        await axios.post('/api/clients', { ...form, business_id: currentBusiness.id })
      }
      setModal(false)
      load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Delete ${c.name}? This may affect existing invoices.`)) return
    await axios.delete(`/api/clients/${c.id}`)
    load()
  }

  const filtered = clients.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const F = ({ label, field, type = 'text', placeholder }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {field === 'address' ? (
        <textarea className="input resize-none h-20" placeholder={placeholder} value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
      ) : (
        <input type={type} className="input" placeholder={placeholder} value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
      )}
    </div>
  )

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentBusiness?.name}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{search ? 'No clients match your search' : 'No clients yet'}</p>
          {!search && <button onClick={openNew} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Add first client</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card p-5 hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">{c.name[0].toUpperCase()}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="font-semibold text-gray-900">{c.name}</p>
              {c.company && <p className="text-sm text-gray-500">{c.company}</p>}
              {c.email && <p className="text-xs text-gray-400 mt-2">{c.email}</p>}
              {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Client' : 'Add Client'}>
        <div className="space-y-4">
          <F label="Name *" field="name" placeholder="John Doe" />
          <F label="Company" field="company" placeholder="Acme Sdn Bhd" />
          <F label="Email" field="email" type="email" placeholder="john@acme.com" />
          <F label="Phone" field="phone" placeholder="+60 12-345 6789" />
          <F label="Address" field="address" placeholder="123 Jalan Utama, Kuala Lumpur" />
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 btn-primary justify-center py-2.5 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update Client' : 'Add Client'}
            </button>
            <button onClick={() => setModal(false)} className="btn-secondary px-5">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
