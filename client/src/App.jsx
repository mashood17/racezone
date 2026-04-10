import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RaceProvider } from './context/RaceContext'
import DisplayScreen from './pages/DisplayScreen'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <RaceProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<DisplayScreen />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </RaceProvider>
  )
}