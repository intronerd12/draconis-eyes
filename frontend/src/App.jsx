import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Auth from './pages/AuthPro'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import Analytics from './pages/admin/Analytics'
import ScannedItems from './pages/admin/ScannedItems'
import ApiMonitoring from './pages/admin/ApiMonitoring'
import EnvironmentalData from './pages/admin/EnvironmentalData'
import ProtectedRoute from './components/admin/ProtectedRoute'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        
        {/* Admin Routes - Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="scans" element={<ScannedItems />} />
            <Route path="environment" element={<EnvironmentalData />} />
            <Route path="api-health" element={<ApiMonitoring />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
