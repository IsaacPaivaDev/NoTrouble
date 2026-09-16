import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import Avatar from '../components/Avatar'
import { mediaUrl } from '../utils/media'
import { IconUsers, IconHome, IconSun, IconMoon } from '../utils/icons'

const IconPaleta = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828L13 15.657" />
  </svg>
)

export default function Settings() {
  const {
    isDarkMode, toggleTheme,
    accent, setAccent, accents,
    background, setBackground, backgrounds,
  } = useTheme()
  const fileInputRef = useRef(null)
  const wallpaperRef = useRef(null)
  const { currentUser, boards } = useBoards(console.error, console.log)

  const [activeTab, setActiveTab] = useState('profile')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [themeHex, setThemeHex] = useState('#3B82F6')
  const [isSaving, setIsSaving] = useState(false)
  const [wallpaperUrl, setWallpaperUrl] = useState(null)
  const [enviandoWp, setEnviandoWp] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    setFirstName(currentUser.first_name || '')
    setLastName(currentUser.last_name || '')
    if (currentUser.company) {
      setCompanyName(currentUser.company.name || '')
      setThemeHex(currentUser.company.theme_hex || '#3B82F6')
      setWallpaperUrl(currentUser.company.wallpaper_url || null)
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
      .catch(() => alert('Erro ao subir foto'))
  }

  const enviarWallpaper = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviandoWp(true)
    const fd = new FormData()
    fd.append('file', file)
    apiFetch('/company/wallpaper/', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.wallpaper_url) { setWallpaperUrl(d.wallpaper_url); localStorage.setItem('notrouble_bg', 'wallpaper') } })
      .catch(() => alert('Erro ao enviar o wallpaper'))
      .finally(() => setEnviandoWp(false))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const payload = { first_name: firstName, last_name: lastName }
      if (password) payload.password = password
      const res = await apiFetch('/users/me/update/', { method: 'PUT', body: JSON.stringify(payload) })
      if (res.ok) { alert('Perfil salvo com sucesso!'); window.location.reload() }
    } catch { alert('Erro ao salvar perfil.') }
    finally { setIsSaving(false) }
  }

  const handleSaveCompany = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch('/company/update/', { method: 'PUT', body: JSON.stringify({ name: companyName, theme_hex: themeHex }) })
      if (res.ok) { alert('Empresa salva com sucesso!'); window.location.reload() }
    } catch { alert('Erro ao atualizar empresa.') }
    finally { setIsSaving(false) }
  }

  const inputClass = `w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`
  const labelClass = `block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`
  const txt = isDarkMode ? 'text-white' : 'text-slate-800'
  const txtFraco = isDarkMode ? 'text-slate-400' : 'text-slate-500'
  const foco = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  const abas = [
    { chave: 'profile',    rotulo: 'Meu Perfil',       Icon: IconUsers },
    { chave: 'appearance', rotulo: 'Aparencia',        Icon: IconPaleta },
    { chave: 'company',    rotulo: 'Dados da Empresa', Icon: IconHome },
  ]

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h2 className={`text-3xl font-black ${txt}`}>Configuracoes</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2" />
        </div>

        <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>

          <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            {abas.map(({ chave, rotulo, Icon }) => (
              <button key={chave} onClick={() => setActiveTab(chave)}
                      className={`flex items-center justify-center gap-2 flex-1 p-4 font-bold text-sm tracking-wide transition-colors motion-reduce:transition-none ${foco} ${
                        activeTab === chave ? 'border-b-2 border-blue-500 text-blue-500'
                                            : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>
                <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{rotulo}</span>
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">

            {/* ---- PERFIL ---- */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h3 className={`text-lg font-bold mb-4 ${txt}`}>Sua Foto</h3>
                  <div className="flex items-center gap-6">
                    <button onClick={handleAvatarClick}
                            className={`rounded-full transition-transform hover:scale-105 motion-reduce:transition-none ${foco}`}>
                      <Avatar
                        url={currentUser?.avatar_url}
                        firstName={currentUser?.first_name}
                        lastName={currentUser?.last_name}
                        username={currentUser?.username}
                        size="h-24 w-24" textSize="text-2xl"
                        className={`shadow-lg border-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}
                      />
                    </button>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      <button onClick={handleAvatarClick}
                              className={`px-4 py-2 rounded-lg font-bold text-sm border shadow-sm transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                        Carregar nova foto
                      </button>
                      <p className={`text-xs mt-2 ${txtFraco}`}>JPG ou PNG, ate 2 MB.</p>
                    </div>
                  </div>
                </div>

                <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

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
                    <label className={labelClass}>Nova senha (opcional)</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe em branco para manter a atual" className={inputClass} />
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={isSaving}
                        className={`px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50 transition-colors motion-reduce:transition-none ${foco}`}>
                  {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
                </button>
              </div>
            )}

            {/* ---- APARENCIA ---- */}
            {activeTab === 'appearance' && (
              <div className="space-y-8">

                <div>
                  <h3 className={`text-lg font-bold mb-1 ${txt}`}>Modo</h3>
                  <p className={`text-sm mb-4 ${txtFraco}`}>Vale so para voce, neste navegador.</p>
                  <div className="flex gap-2">
                    {[{ escuro: true, rotulo: 'Escuro', Icon: IconMoon }, { escuro: false, rotulo: 'Claro', Icon: IconSun }].map(m => (
                      <button key={m.rotulo} onClick={() => { if (isDarkMode !== m.escuro) toggleTheme() }}
                              aria-pressed={isDarkMode === m.escuro}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-colors motion-reduce:transition-none ${foco} ${
                                isDarkMode === m.escuro ? 'bg-blue-600 border-blue-600 text-white'
                                : (isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-600')}`}>
                        <m.Icon /> {m.rotulo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                <div>
                  <h3 className={`text-lg font-bold mb-1 ${txt}`}>Cor de destaque</h3>
                  <p className={`text-sm mb-4 ${txtFraco}`}>Muda botoes, links e graficos no sistema inteiro.</p>
                  <div className="flex flex-wrap gap-3">
                    {accents.map(a => (
                      <button key={a.chave} onClick={() => setAccent(a.chave)} aria-pressed={accent === a.chave}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-colors motion-reduce:transition-none ${foco} ${
                                accent === a.chave ? 'border-blue-500' : (isDarkMode ? 'border-slate-700' : 'border-slate-200')}`}>
                        <span className="w-9 h-9 rounded-lg shadow-inner" style={{ backgroundColor: a.hex }} />
                        <span className={`text-[10px] font-bold ${accent === a.chave ? txt : txtFraco}`}>{a.rotulo}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                <div>
                  <h3 className={`text-lg font-bold mb-1 ${txt}`}>Fundo animado</h3>
                  <p className={`text-sm mb-4 ${txtFraco}`}>
                    Escolha e aplicada na hora. Se o seu sistema pede menos movimento, a animacao fica parada automaticamente.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {backgrounds.map(f => (
                      <button key={f.chave} onClick={() => setBackground(f.chave)} aria-pressed={background === f.chave}
                              className={`text-left p-3 rounded-xl border transition-colors motion-reduce:transition-none ${foco} ${
                                background === f.chave ? 'border-blue-500 bg-blue-500/10'
                                : (isDarkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300')}`}>
                        <p className={`font-bold text-sm ${txt}`}>{f.rotulo}</p>
                        <p className={`text-[11px] ${txtFraco}`}>{f.descricao}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`h-px w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                <div>
                  <h3 className={`text-lg font-bold mb-1 ${txt}`}>Imagem de fundo</h3>
                  <p className={`text-sm mb-4 ${txtFraco}`}>Uma imagem para toda a empresa, no lugar do fundo animado.</p>

                  <div className="flex items-center gap-4 flex-wrap">
                    {wallpaperUrl && (
                      <img src={mediaUrl(wallpaperUrl)} alt=""
                           onError={e => { e.currentTarget.style.display = 'none' }}
                           className={`h-16 w-28 object-cover rounded-lg border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} />
                    )}
                    <input type="file" ref={wallpaperRef} onChange={enviarWallpaper} className="hidden" accept="image/*" />
                    <button onClick={() => wallpaperRef.current?.click()} disabled={enviandoWp}
                            className={`px-4 py-2 rounded-lg font-bold text-sm border shadow-sm disabled:opacity-50 transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                      {enviandoWp ? 'Enviando...' : (wallpaperUrl ? 'Trocar imagem' : 'Enviar imagem')}
                    </button>
                  </div>

                  <div className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                      As imagens enviadas ficam no disco do servidor, que e recriado a cada atualizacao do sistema.
                      Fotos de perfil e imagens de fundo somem quando isso acontece. Ate mudarmos o armazenamento para
                      a nuvem, prefira os fundos animados acima, que nao dependem de upload.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ---- EMPRESA ---- */}
            {activeTab === 'company' && (
              <div className="space-y-8">
                <div>
                  <label className={labelClass}>Nome da empresa / workspace</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                         disabled={currentUser?.role !== 'ADMIN'} className={`${inputClass} disabled:opacity-50`} />
                </div>

                <div>
                  <label className={labelClass}>Cor da marca</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={themeHex} onChange={e => setThemeHex(e.target.value)}
                           disabled={currentUser?.role !== 'ADMIN'}
                           className="h-12 w-12 rounded cursor-pointer border-0 p-0 shadow-sm disabled:opacity-50" />
                    <span className={`font-mono text-lg font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{themeHex}</span>
                  </div>
                  <p className={`text-xs mt-2 ${txtFraco}`}>
                    Guardada para relatorios e materiais da empresa. Para mudar as cores do sistema, use a aba Aparencia.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                    Apenas o administrador altera os dados da empresa, e a mudanca vale para todos os membros.
                  </p>
                </div>

                {currentUser?.role === 'ADMIN' && (
                  <button onClick={handleSaveCompany} disabled={isSaving}
                          className={`px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50 transition-colors motion-reduce:transition-none ${foco}`}>
                    {isSaving ? 'Atualizando...' : 'Atualizar dados da empresa'}
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