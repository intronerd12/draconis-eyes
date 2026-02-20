import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Features from './pages/Features'
import Home from './pages/Home'
import Auth from './pages/AuthPro'
import Overview from './pages/Overview'
import AiAnalysis from './pages/AiAnalysis'
import Marketplace from './pages/Marketplace'
import UserFeatures from './pages/UserFeatures'
import UserAdmin from './pages/UserAdmin'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminFeatures from './pages/admin/AdminFeatures'
import AdminAiAnalysis from './pages/admin/AdminAiAnalysis'
import AdminMarketplace from './pages/admin/AdminMarketplace'
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
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/user-features" element={<UserFeatures />} />
        <Route path="/ai-analysis" element={<AiAnalysis />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/user-admin" element={<UserAdmin />} />
        
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
          <Route path="/admin/features" element={<AdminFeatures />} />
          <Route path="/admin/ai-analysis" element={<AdminAiAnalysis />} />
          <Route path="/admin/marketplace" element={<AdminMarketplace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
