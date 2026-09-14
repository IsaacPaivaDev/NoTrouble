import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute, { GuestOnlyRoute } from './components/ProtectedRoute'

import Login from './pages/Login'
import Board from './pages/Board'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import Data from './pages/Data'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Team from './pages/Team'
import Invite from './pages/Invite'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route path="/verify" element={<Verify />} />
            <Route path="/invite" element={<Invite />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/board" element={<Board />} />
              <Route path="/data" element={<Data />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App