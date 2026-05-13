import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards' 
import { apiFetch } from '../api/client'
import { formatDate, formatTime, getInitials, getColorFromString, formatCurrency } from '../utils/formatters' 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Data() {
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeReport, setActiveReport] = useState('activity_log')
  
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [logsError, setLogsError] = useState(null) 

  const [dashboardData, setDashboardData] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState(null)

  const { currentUser } = useBoards(console.error, console.log)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  useEffect(() => {
    if (activeReport === 'activity_log') {
      setLoadingLogs(true)
      apiFetch('/analytics/logs/')
        .then(res => {
          if (!res.ok) throw new Error(`Erro ${res.status}: Rota não encontrada.`)
          return res.json()
        })
        .then(data => setLogs(data))
        .catch(err => setLogsError(err.message))
        .finally(() => setLoadingLogs(false))
    }
  }, [activeReport])

  useEffect(() => {
    if (activeReport !== 'activity_log') {
      setLoadingDashboard(true)
      setDashboardError(null)
      apiFetch('/analytics/dashboard/')
        .then(res => {
          if (!res.ok) throw new Error(`Erro ${res.status}: Falha ao calcular métricas.`)
          return res.json()
        })
        .then(data => setDashboardData(data))
        .catch(err => {
          console.error("Erro ao carregar Dashboard", err)
          setDashboardError(err.message)
        })
        .finally(() => setLoadingDashboard(false))
    }
  }, [activeReport])

  const handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login') }

  const getActionIcon = (action) => {
    switch(action) {
      case 'CREATED': return { icon: '✨', color: 'bg-blue-500 text-white' };
      case 'UPDATED': return { icon: '✏️', color: 'bg-yellow-500 text-white' };
      case 'MOVED': return { icon: '➡️', color: 'bg-purple-500 text-white' };
      case 'COMPLETED': return { icon: '✅', color: 'bg-green-500 text-white' };
      case 'DELETED': return { icon: '🗑️', color: 'bg-red-500 text-white' };
      default: return { icon: '📝', color: 'bg-slate-500 text-white' };
    }
  }

  // 🚀 PROTEÇÃO MÁXIMA AQUI: Só tenta ler se dashboardData existir de verdade
  const productivityPieData = dashboardData?.productivity ? [
    { name: 'Concluídos', value: dashboardData.productivity.current_completed || 0, color: '#10B981' }, 
    { name: 'No Prazo (Ativos)', value: dashboardData.productivity.current_on_time || 0, color: '#3B82F6' }, 
    { name: 'Atrasados', value: dashboardData.productivity.current_delayed || 0, color: '#EF4444' } 
  ].filter(d => d.value > 0) : [];

  const financialBarData = dashboardData?.financial ? [
    { name: 'Investimento (Custo)', valor: dashboardData.financial.total_invested || 0 },
    { name: 'Estimado (Receita)', valor: dashboardData.financial.total_estimated || 0 },
    { name: 'Lucro Realizado', valor: dashboardData.financial.total_profit || 0 },
    { name: 'Prejuízo Realizado', valor: dashboardData.financial.total_loss || 0 }
  ] : [];

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 text-slate-200' : 'bg-white text-slate-700'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-500/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Notrouble</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded hover:bg-slate-500/20 px-1">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-2 px-4">
            <button onClick={() => navigate('/')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>🏠 Início / Painel</button>
            <button onClick={() => navigate('/board')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>📊 Ir para os Quadros</button>
            <button onClick={() => navigate('/data')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>📈 Relatórios</button>
            <button onClick={() => navigate('/team')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>👥 Equipe</button>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-500/20"><button onClick={handleLogout} className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold">🚪 Sair</button></div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`p-6 flex items-center justify-between shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-b border-slate-700' : 'bg-white/90 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-lg font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>☰ Menu</button>
            <h1 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-3 tracking-tight`}>
            {currentUser?.company?.name ? (
              <>
                <span className="uppercase">{currentUser.company.name}</span>
                <span className="text-xs font-normal opacity-40 border-l-2 border-slate-500 pl-3 tracking-widest hidden md:inline-block">POWERED BY NOTROUBLE</span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Notrouble</span>
            )}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className="text-2xl hover:scale-110 transition-transform">{isDarkMode ? '☀️' : '🌙'}</button>
            
            {currentUser ? (
              <div 
                className={`h-10 w-10 rounded-full shadow-lg cursor-pointer overflow-hidden flex items-center justify-center font-bold text-sm ${isDarkMode ? 'border border-slate-700 text-slate-100' : 'border border-slate-100 text-white'}`}
                style={{ backgroundColor: !currentUser.avatar_url ? (getColorFromString(currentUser.username) || '#3B82F6') : 'transparent' }}
                title={currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.username}
              >
                {currentUser.avatar_url ? (
                  <img src={`${API_BASE}${currentUser.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (currentUser.first_name ? getInitials(currentUser.first_name, currentUser.last_name, currentUser.username) : '') || currentUser.username?.substring(0, 2).toUpperCase() || 'U'
                )}
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-300 animate-pulse"></div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative custom-scrollbar">
          <div className="max-w-6xl mx-auto animate-fade-in">
            
            <div className={`p-6 md:p-8 rounded-3xl shadow-sm border mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Central de Inteligência</h2>
                <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecione a área de negócio que deseja analisar hoje.</p>
              </div>

              <div className="w-full md:w-auto">
                <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Módulo de Visão</label>
                <div className={`relative rounded-xl border overflow-hidden shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-300'}`}>
                  <select 
                    value={activeReport}
                    onChange={(e) => setActiveReport(e.target.value)}
                    className={`w-full md:w-64 p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm cursor-pointer ${isDarkMode ? 'bg-transparent text-white' : 'bg-transparent text-slate-800'}`}
                  >
                    <option value="activity_log" className="bg-slate-800 text-white font-medium">📝 Log de Atividades</option>
                    <option value="financial" className="bg-slate-800 text-white font-medium">💰 Análise Financeira</option>
                    <option value="productivity" className="bg-slate-800 text-white font-medium">📈 Produtividade & Prazos</option>
                    <option value="tags" className="bg-slate-800 text-white font-medium">🏷️ Distribuição de Etiquetas</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-blue-500 font-bold">▼</div>
                </div>
              </div>
            </div>

            {/* ABA 1: LOGS */}
            {activeReport === 'activity_log' && (
              <div className="animate-fade-in max-w-4xl mx-auto">
                {loadingLogs ? (
                  <div className="animate-pulse space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>)}</div>
                ) : logsError ? (
                  <div className={`p-8 rounded-2xl border-2 border-dashed text-center font-bold ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-300 text-red-600'}`}>⚠️ {logsError}</div>
                ) : (
                  <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    {logs.length === 0 ? (
                      <p className="text-center py-8 opacity-50 font-medium">Nenhuma atividade registada ainda na sua empresa.</p>
                    ) : (
                      <div className="relative border-l-2 ml-4 border-slate-200 dark:border-slate-700 space-y-8 pb-4">
                        {logs.map((log) => {
                          const { icon, color } = getActionIcon(log.action);
                          return (
                            <div key={log.id} className="relative pl-8 animate-fade-in">
                              <div className={`absolute -left-5 top-0 h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-lg ring-4 ${isDarkMode ? 'ring-slate-900' : 'ring-white'} ${color}`}>{icon}</div>
                              <div className={`p-4 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{log.user_name} <span className="font-normal opacity-70">{log.description}</span></p>
                                  <span className="text-xs font-bold uppercase tracking-wider opacity-50 whitespace-nowrap ml-4">{formatDate(log.created_at)} às {formatTime(log.created_at)}</span>
                                </div>
                                <span className={`inline-block px-2 py-1 mt-2 rounded text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white border text-slate-500'}`}>🗂️ {log.board_name}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: FINANCEIRO */}
            {activeReport === 'financial' && (
              <div className="animate-fade-in space-y-8">
                {loadingDashboard ? (
                  <div className="h-64 flex items-center justify-center font-bold text-slate-500 animate-pulse">A calcular receitas e despesas...</div>
                ) : dashboardError ? (
                  <div className={`p-8 rounded-2xl border-2 border-dashed text-center font-bold ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-300 text-red-600'}`}>⚠️ {dashboardError}</div>
                ) : dashboardData?.financial && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Faturamento Estimado</p>
                        <p className="text-3xl font-black text-blue-500">{formatCurrency(dashboardData.financial.total_estimated || 0)}</p>
                      </div>
                      <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Custo / Investimento</p>
                        <p className="text-3xl font-black text-amber-500">{formatCurrency(dashboardData.financial.total_invested || 0)}</p>
                      </div>
                      <div className={`p-6 rounded-2xl border shadow-sm ${dashboardData.financial.balance >= 0 ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200') : (isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200')}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dashboardData.financial.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Saldo Geral (Lucro/Prejuízo)</p>
                        <p className={`text-3xl font-black ${dashboardData.financial.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(dashboardData.financial.balance || 0)}</p>
                      </div>
                    </div>

                    <div className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Balanço Detalhado</h3>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={financialBarData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                            <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => `€${value}`} />
                            <RechartsTooltip cursor={{fill: isDarkMode ? '#1e293b' : '#f1f5f9'}} formatter={(value) => formatCurrency(value)} contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px'}}/>
                            <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ABA 3: PRODUTIVIDADE */}
            {activeReport === 'productivity' && (
              <div className="animate-fade-in space-y-8">
                {loadingDashboard ? (
                  <div className="h-64 flex items-center justify-center font-bold text-slate-500 animate-pulse">A calcular a velocidade da equipa...</div>
                ) : dashboardError ? (
                  <div className={`p-8 rounded-2xl border-2 border-dashed text-center font-bold ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-300 text-red-600'}`}>⚠️ {dashboardError}</div>
                ) : dashboardData?.productivity && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className={`p-6 rounded-2xl border shadow-sm text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className="text-3xl mb-2">✨</p><p className="text-2xl font-black text-blue-500">{dashboardData.productivity.cards_created || 0}</p><p className="text-xs font-bold text-slate-500 uppercase mt-1">Cards Criados</p>
                      </div>
                      <div className={`p-6 rounded-2xl border shadow-sm text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className="text-3xl mb-2">➡️</p><p className="text-2xl font-black text-purple-500">{dashboardData.productivity.cards_moved || 0}</p><p className="text-xs font-bold text-slate-500 uppercase mt-1">Movimentações</p>
                      </div>
                      <div className={`p-6 rounded-2xl border shadow-sm text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className="text-3xl mb-2">✅</p><p className="text-2xl font-black text-emerald-500">{dashboardData.productivity.current_completed || 0}</p><p className="text-xs font-bold text-slate-500 uppercase mt-1">Concluídos</p>
                      </div>
                      <div className={`p-6 rounded-2xl border shadow-sm text-center ${dashboardData.productivity.current_delayed > 0 ? (isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200') : (isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200')}`}>
                        <p className="text-3xl mb-2">🚨</p><p className={`text-2xl font-black ${dashboardData.productivity.current_delayed > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>{dashboardData.productivity.current_delayed || 0}</p><p className={`text-xs font-bold uppercase mt-1 ${dashboardData.productivity.current_delayed > 0 ? 'text-rose-500' : 'text-slate-500'}`}>Atrasados Agora</p>
                      </div>
                    </div>

                    <div className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-8 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="w-full md:w-1/2">
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Status Geral do Funil</h3>
                        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Distribuição em tempo real de todos os cards da empresa.</p>
                        <div className="space-y-4">
                          {productivityPieData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span><span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{entry.name}</span></div>
                              <span className="font-black text-lg">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 h-64">
                        {productivityPieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={productivityPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                {productivityPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px'}} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center italic opacity-50">Sem dados para exibir.</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ABA 4: TAGS */}
            {activeReport === 'tags' && (
              <div className="animate-fade-in space-y-8">
                {loadingDashboard ? (
                  <div className="h-64 flex items-center justify-center font-bold text-slate-500 animate-pulse">A contar etiquetas...</div>
                ) : dashboardError ? (
                  <div className={`p-8 rounded-2xl border-2 border-dashed text-center font-bold ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-300 text-red-600'}`}>⚠️ {dashboardError}</div>
                ) : dashboardData?.tags && (
                  <div className={`p-8 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Etiquetas Mais Utilizadas</h3>
                    <p className={`text-sm mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mapeamento de frequência de tags nos seus projetos.</p>
                    
                    {dashboardData.tags.length === 0 ? (
                      <div className="text-center py-12 italic opacity-50">Ainda não categorizou cards com etiquetas.</div>
                    ) : (
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={dashboardData.tags} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                {dashboardData.tags.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px'}} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                          {dashboardData.tags.map((tag, index) => (
                            <div key={index} className={`p-4 rounded-xl border flex flex-col justify-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center gap-2 mb-2"><span className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: tag.color }}></span><span className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tag.name}</span></div>
                              <span className="text-2xl font-black">{tag.value} <span className="text-xs font-bold uppercase text-slate-500">Cards</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}