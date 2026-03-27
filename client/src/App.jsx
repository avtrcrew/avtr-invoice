import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import axios from 'axios'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceView from './pages/InvoiceView'
import Transactions from './pages/Transactions'
import Clients from './pages/Clients'
import Settings from './pages/Settings'

axios.defaults.withCredentials = true

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [currentBusiness, setCurrentBusiness] = useState(null)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      await axios.get('/api/auth/me')
      setIsAuthenticated(true)
      await loadBusinesses()
    } catch {
      setIsAuthenticated(false)
    }
  }

  const loadBusinesses = async () => {
    const res = await axios.get('/api/businesses')
    setBusinesses(res.data)
    const savedId = localStorage.getItem('currentBusinessId')
    const found = res.data.find(b => b.id === parseInt(savedId))
    setCurrentBusiness(found || res.data[0])
  }

  const selectBusiness = (biz) => {
    setCurrentBusiness(biz)
    localStorage.setItem('currentBusinessId', biz.id)
  }

  const login = async () => {
    setIsAuthenticated(true)
    await loadBusinesses()
  }

  const logout = async () => {
    await axios.post('/api/auth/logout')
    setIsAuthenticated(false)
    setCurrentBusiness(null)
    setBusinesses([])
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ businesses, currentBusiness, selectBusiness, logout, refreshBusinesses: loadBusinesses }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={login} />} />
          {isAuthenticated ? (
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="/invoices/:id" element={<InvoiceView />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}

export default App
