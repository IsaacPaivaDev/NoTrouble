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
import Settings from './pages/Settings'
import Team from './pages/Team'
import Invite from './pages/Invite'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 🚪 Rotas só para visitantes (deslogados).
                Se o usuário JÁ está logado e tentar abrir /login, vai pra home. */}
            <Route element={<GuestOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* 🌐 Rotas 100% públicas: qualquer pessoa pode abrir.
                /verify e /invite recebem token na URL e funcionam sem login. */}
            <Route path="/verify" element={<Verify />} />
            <Route path="/invite" element={<Invite />} />

            {/* 🛡️ Rotas protegidas: precisa estar autenticado.
                Tudo aqui dentro só renderiza se o ProtectedRoute liberar. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/board" element={<Board />} />
              <Route path="/data" element={<Data />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all: rota inexistente volta pra home (que vai mandar
                pro /login se não estiver logado). */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App