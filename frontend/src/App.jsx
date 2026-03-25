import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import AccountOpen from './pages/AccountOpen'
import AccountLookup from './pages/AccountLookup'
import Transfer from './pages/Transfer'
import AccountHistory from './pages/AccountHistory'
import TransferHistory from './pages/TransferHistory'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/account/open" element={<PrivateRoute><AccountOpen /></PrivateRoute>} />
        <Route path="/account/lookup" element={<PrivateRoute><AccountLookup /></PrivateRoute>} />
        <Route path="/transfer" element={<PrivateRoute><Transfer /></PrivateRoute>} />
        <Route path="/account/history" element={<PrivateRoute><AccountHistory /></PrivateRoute>} />
        <Route path="/transfer/history" element={<PrivateRoute><TransferHistory /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
