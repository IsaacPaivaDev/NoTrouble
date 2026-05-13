import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Board from './pages/Board'
import Register from './pages/Register'
import Verify from './pages/Verify' 
import Dashboard from './pages/Dashboard'
import Data from './pages/Data' 
import Settings from './pages/Settings'
import Team from './pages/Team'
import Invite from './pages/Invite'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} /> 

          <Route path="/" element={<Dashboard />} />
          <Route path="/board" element={<Board />} />
          <Route path="/data" element={<Data />} /> 
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/invite" element={<Invite />} />

          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App