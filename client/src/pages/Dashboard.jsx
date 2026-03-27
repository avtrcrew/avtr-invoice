import { useEffect, useState } from 'react'
import { useApp } from '../App'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Clock, AlertCircle, FileText, ArrowLeftRight, Plus } from 'lucide-react'

const fmt = (n) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_BADGE = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-700',
  paid:     'bg-green-100 text-green-700',
  overdue:  'bg-red-100 text-red-700',
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { currentBusiness } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentBusiness) return
    setLoading(true)
    axios.get(`/api/dashboard?business_id=${currentBusiness.id}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [currentBusiness])

  if (!currentBusiness) return <div className="p-8 text-gray-400">No business selected.</div>

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  const profit = (data?.totalPaid || 0) - (data?.totalExpenses || 0)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentBusiness.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of your financial activity</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/invoices/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {data?.overdueCount > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          You have {data.overdueCount} overdue invoice{data.overdueCount > 1 ? 's' : ''} that need attention.
          <button onClick={() => navigate('/invoices')} className="ml-auto underline font-medium">View</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Invoiced" value={fmt(data?.totalInvoiced)} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Collected" value={fmt(data?.totalPaid)} icon={TrendingUp} color="bg-green-50 text-green-600" />
        <StatCard label="Outstanding" value={fmt(data?.totalOutstanding)} icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard label="Expenses" value={fmt(data?.totalExpenses)} icon={TrendingDown} color="bg-red-50 text-red-500" sub={`Net: ${fmt(profit)}`} />
      </div>

      {/* Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Recent Invoices
            </h2>
            <button onClick={() => navigate('/invoices')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentInvoices?.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No invoices yet</p>
            )}
            {data?.recentInvoices?.map(inv => (
              <button
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400">{inv.client_name || 'No client'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{fmt(inv.total)}</p>
                  <span className={`badge ${STATUS_BADGE[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                    {inv.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-gray-400" /> Recent Transactions
            </h2>
            <button onClick={() => navigate('/transactions')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentTransactions?.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No transactions yet</p>
            )}
            {data?.recentTransactions?.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.description || tx.category || '—'}</p>
                  <p className="text-xs text-gray-400">{tx.date} · {tx.category || '—'}</p>
                </div>
                <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
