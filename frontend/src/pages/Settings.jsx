import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import { mediaUrl } from '../utils/media'
import { getInitials, getColorFromString } from '../utils/formatters'
import { IconUsers, IconHome } from '../utils/icons'

export default function Settings() {
  const { isDarkMode } = useTheme()
  const fileInputRef = useRef(null)
  const { currentUser, boards } = useBoards(console.error, console.log)

  const [activeTab, setActiveTab] = useState('profile')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [themeHex, setThemeHex] = useState('#3B82F6')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name || '')
      setLastName(currentUser.last_name || '')
      if (currentUser.company) {
        setCompanyName(currentUser.company.name || '')
        setThemeHex(currentUser.company.theme_hex || '#3B82F6')
      }
    }
  }, [currentUser])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    apiFetch('/users/me/avatar/', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => { if (data.success) window.location.reload() })
      .catch(() => alert("Erro ao subir foto"))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const payload = { first_name: firstName, last_name: lastName }
      if (password) payload.password = password
      const res = await apiFetch('/users/me/update/', { method: 'PUT', body: JSON.stringify(payload) })
      if (res.ok) { alert("Perfil salvo com sucesso!"); window.location.reload() }
    } catch { alert("Erro ao salvar perfil.") }
    finally { setIsSaving(false) }
  }

  const handleSaveCompany = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch('/company/update/', { method: 'PUT', body: JSON.stringify({ name: companyName, theme_hex: themeHex }) })
      if (res.ok) { alert("Empresa salva com sucesso!"); window.location.reload() }
    } catch { alert("Erro ao atualizar empresa.") }
    finally { setIsSaving(false) }
  }

  const inputClass = `w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`
  const labelClass = `block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Configuracoes</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
        </div>

        <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>

          {/* Tabs */}
          <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <button onClick={() => setActiveTab('profile')} className={`flex items-center justify-center gap-2 flex-1 p-4 font-bold text-sm tracking-wide transition-colors ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-500' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>
              <IconUsers className="w-4 h-4" /> Meu Perfil
            </button>
            <button onClick={() => setActiveTab('company')} className={`flex items-center justify-center gap-2 flex-1 p-4 font-bold text-sm tracking-wide transition-colors ${activeTab === 'company' ? 'border-b-2 border-blue-500 text-blue-500' : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>
              <IconHome className="w-4 h-4" /> Dados da Empresa
            </button>
          </div>

          <div className="p-8">
            {/* ---- PERFIL ---- */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Foto */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Sua Foto</h3>
                  <div className="flex items-center gap-6">
                    <div
                      onClick={handleAvatarClick}
                      className={`h-24 w-24 rounded-full shadow-lg cursor-pointer overflow-hidden flex items-center justify-center font-bold text-2xl border-4 transition-transform hover:scale-105 ${isDarkMode ? 'border-slate-700 text-slate-100 hover:border-blue-500' : 'border-slate-100 text-white hover:border-blue-300'}`}
                      style={{ backgroundColor: currentUser && !currentUser.avatar_url ? (getColorFromString(currentUser?.username) || '#3B82F6') : 'transparent' }}
                    >
                      {currentUser?.avatar_url
                        ? <img src={mediaUrl(currentUser.avatar_url)} alt="" className="h-full w-full object-cover" />
                        : currentUser ? (getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) || currentUser.username?.substring(0, 2).toUpperCase()) : 'U'
                      }
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      <button onClick={handleAvatarClick} className={`px-4 py-2 rounded-lg font-bold text-sm border shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Carregar Nova Foto</button>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>JPG, PNG. Tamanho maximo 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                {/* Dados pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Nome</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Sobrenome</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nova Senha (Opcional)</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe em branco para manter a atual" className={inputClass} />
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
                </button>
              </div>
            )}

            {/* ---- EMPRESA ---- */}
            {activeTab === 'company' && (
              <div className="space-y-8">
                <div>
                  <label className={labelClass}>Nome da Empresa / Workspace</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={currentUser?.role !== 'ADMIN'} className={`${inputClass} disabled:opacity-50`} />
                </div>

                <div>
                  <label className={labelClass}>Cor Principal (Tema)</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={themeHex} onChange={e => setThemeHex(e.target.value)} disabled={currentUser?.role !== 'ADMIN'} className="h-12 w-12 rounded cursor-pointer border-0 p-0 shadow-sm disabled:opacity-50" />
                    <span className={`font-mono text-lg font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{themeHex}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                    Apenas o Administrador pode alterar os dados da empresa. Alterar a cor ou o nome afetara todos os membros.
                  </p>
                </div>

                {currentUser?.role === 'ADMIN' && (
                  <button onClick={handleSaveCompany} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                    {isSaving ? 'Atualizando...' : 'Atualizar Dados da Empresa'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}