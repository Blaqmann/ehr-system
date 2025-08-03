// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUserManagement from './pages/AdminUserManagement'
import PatientRegistration from './pages/PatientRegistration'
import PatientSearch from './pages/PatientSearch'
import PatientProfile from './pages/PatientProfile'
import Unauthorized from './pages/Unauthorized'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import './index.css'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><AdminUserManagement /></ProtectedRoute>} />
                <Route path="/patients/register" element={<ProtectedRoute allowedRoles={['Healthcare Worker']}><PatientRegistration /></ProtectedRoute>} />
                <Route path="/patients/search" element={<ProtectedRoute allowedRoles={['Admin', 'Healthcare Worker']}><PatientSearch /></ProtectedRoute>} />
                <Route path="/patients/:patientId" element={<ProtectedRoute allowedRoles={['Admin', 'Healthcare Worker', 'Patient']}><PatientProfile /></ProtectedRoute>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}