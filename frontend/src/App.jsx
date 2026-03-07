import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Landing from './pages/Landing'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Features from './pages/Features'
import Home from './pages/Home'
import Auth from './pages/AuthPro'
import Overview from './pages/Overview'
import AiAnalysis from './pages/AiAnalysis'
import SortingGrading from './pages/SortingGrading'
import CommunityForum from './pages/CommunityForum'
import Environment from './pages/Environment'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminFeatures from './pages/admin/AdminFeatures'
import AdminAiAnalysis from './pages/admin/AdminAiAnalysis'
import AdminMarketplace from './pages/admin/AdminMarketplace'
import UserManagement from './pages/admin/UserManagement'
import Analytics from './pages/admin/Analytics'
import ScannedItems from './pages/admin/ScannedItems'
import ApiMonitoring from './pages/admin/ApiMonitoring'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { API_BASE_URL } from './config/api'
import './App.css'

function App() {
  const forcedLogoutRef = useRef(false)

  useEffect(() => {
    const checkSession = async () => {
      const rawUser = localStorage.getItem('user')
      if (!rawUser) {
        forcedLogoutRef.current = false
        return
      }

      let parsedUser
      try {
        parsedUser = JSON.parse(rawUser)
      } catch (_error) {
        localStorage.removeItem('user')
        return
      }

      if (!parsedUser?.token) return

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/session`, {
          headers: {
            Authorization: `Bearer ${parsedUser.token}`,
          },
        })

        if (res.ok) {
          forcedLogoutRef.current = false
          return
        }

        if (res.status !== 401 && res.status !== 403) return

        if (forcedLogoutRef.current) return
        forcedLogoutRef.current = true

        const body = await res.json().catch(() => ({}))
        localStorage.removeItem('user')
        toast.error(body?.message || 'Your session ended due to account status update.')
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      } catch (_error) {
        // Ignore transient network errors; only force logout on explicit auth/status failures.
      }
    }

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        checkSession()
      }
    }

    checkSession()
    const intervalId = window.setInterval(checkSession, 30000)
    window.addEventListener('focus', checkSession)
    document.addEventListener('visibilitychange', visibilityHandler)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', checkSession)
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [])

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
        <Route path="/ai-analysis" element={<AiAnalysis />} />
        <Route path="/sorting-grading" element={<SortingGrading />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/community" element={<CommunityForum />} />
        <Route path="/user-features" element={<Navigate to="/community" replace />} />
        <Route path="/marketplace" element={<Navigate to="/community" replace />} />
        <Route path="/user-admin" element={<Navigate to="/community" replace />} />
        
        {/* Admin Routes - Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="scans" element={<ScannedItems />} />
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
