import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useBoards } from '../hooks/useBoards'
import { apiFetch } from '../api/client'
import PageLayout from '../components/PageLayout'
import { formatDate, formatTime, formatCurrency } from '../utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const REPORT_OPTIONS = [
  { value: 'activity_log', label: 'Log de Atividades' },
  { value: 'financial', label: 'Analise Financeira' },
  { value: 'productivity', label: 'Produtividade & Prazos' },
  { value: 'tags', label: 'Distribuicao de Etiquetas' },
]

export default function Data() {
  const { isDarkMode } = useTheme()
  const [activeReport, setActiveReport] = useState('activity_log')
  const [reportMenuOpen, setReportMenuOpen] = useState(false)

  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [logsError, setLogsError] = useState(null)

  const [dashboardData, setDashboardData] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState(null)

  const { boards, currentUser } = useBoards(console.error, console.log)

  useEffect(() => {
    if (activeReport === 'activity_log') {
      setLoadingLogs(true)
      apiFetch('/analytics/logs/')
        .then(r => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json() })
        .then(d => setLogs(d))
        .catch(e => setLogsError(e.message))
        .finally(() => setLoadingLogs(false))
    }
  }, [activeReport])

  useEffect(() => {
    if (activeReport !== 'activity_log') {
      setLoadingDashboard(true); setDashboardError(null)
      apiFetch('/analytics/dashboard/')
        .then(r => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json() })
        .then(d => setDashboardData(d))
        .catch(e => setDashboardError(e.message))
        .finally(() => setLoadingDashboard(false))
    }
  }, [activeReport])

  const getActionIcon = (action) => {
    const map = {
      CREATED:   { symbol: '+',  color: 'bg-blue-500 text-white' },
      UPDATED:   { symbol: '~',  color: 'bg-amber-500 text-white' },
      MOVED:     { symbol: '→',  color: 'bg-purple-500 text-white' },
      COMPLETED: { symbol: '✓',  color: 'bg-emerald-500 text-white' },
      DELETED:   { symbol: '×',  color: 'bg-red-500 text-white' },
    }
    return map[action] || { symbol: '·', color: 'bg-slate-500 text-white' }
  }

  const tooltipStyle = { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px' }

  const productivityPieData = dashboardData?.productivity ? [
    { name: 'Concluidos', value: dashboardData.productivity.current_completed || 0, color: '#10B981' },
    { name: 'No Prazo', value: dashboardData.productivity.current_on_time || 0, color: '#3B82F6' },
    { name: 'Atrasados', value: dashboardData.productivity.current_delayed || 0, color: '#EF4444' },
  ].filter(d => d.value > 0) : []

  const financialBarData = dashboardData?.financial ? [
    { name: 'Custo', valor: dashboardData.financial.total_invested || 0 },
    { name: 'Receita', valor: dashboardData.financial.total_estimated || 0 },
    { name: 'Lucro', valor: dashboardData.financial.total_profit || 0 },
    { name: 'Prejuizo', valor: dashboardData.financial.total_loss || 0 },
  ] : []

  const ErrorBox = ({ msg }) => <div className={`p-8 rounded-2xl border-2 border-dashed text-center font-bold ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-300 text-red-600'}`}>{msg}</div>

  return (
    <PageLayout boards={boards} currentUser={currentUser}>
      <div className="max-w-6xl mx-auto animate-fade-in">

        {/* Header do modulo */}
        <div className={`p-6 md:p-8 rounded-3xl shadow-sm border mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Central de Inteligencia</h2>
            <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecione a area de negocio que deseja analisar.</p>
          </div>

          {/* Dropdown customizado — sem <select> nativo */}
          <div className="w-full md:w-auto">
            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Modulo de Visao</label>
            <div className="relative">
              <button
                onClick={() => setReportMenuOpen(!reportMenuOpen)}
                className={`w-full md:w-64 p-3 text-left font-bold text-sm flex items-center justify-between rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white hover:border-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-400'}`}
              >
                {REPORT_OPTIONS.find(o => o.value === activeReport)?.label}
                <span className="text-blue-500 text-xs">{reportMenuOpen ? '▲' : '▼'}</span>
              </button>
              {reportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setReportMenuOpen(false)} />
                  <div className={`absolute top-full left-0 w-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                    {REPORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setActiveReport(opt.value); setReportMenuOpen(false) }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors ${activeReport === opt.value ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100')}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ---- LOG DE ATIVIDADES ---- */}
        {activeReport === 'activity_log' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            {loadingLogs ? (
              <div className="animate-pulse space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}</div>
            ) : logsError ? (
              <ErrorBox msg={logsError} />
            ) : (
              <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                {logs.length === 0 ? (
                  <p className="text-center py-8 opacity-50 font-medium">Nenhuma atividade registrada.</p>
                ) : (
                  <div className="relative border-l-2 ml-4 border-slate-200 dark:border-slate-700 space-y-8 pb-4">
                    {logs.map(log => {
                      const { symbol, color } = getActionIcon(log.action)
                      return (
                        <div key={log.id} className="relative pl-8 animate-fade-in">
                          <div className={`absolute -left-5 top-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ${isDarkMode ? 'ring-slate-900' : 'ring-white'} ${color}`}>{symbol}</div>
                          <div className={`p-4 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{log.user_name} <span className="font-normal opacity-70">{log.description}</span></p>
                              <span className="text-xs font-bold uppercase tracking-wider opacity-50 whitespace-nowrap ml-4">{formatDate(log.created_at)} as {formatTime(log.created_at)}</span>
                            </div>
                            <span className={`inline-block px-2 py-1 mt-2 rounded text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white border text-slate-500'}`}>{log.board_name}</span>
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

        {/* ---- FINANCEIRO ---- */}
        {activeReport === 'financial' && (
          <div className="animate-fade-in space-y-8">
            {loadingDashboard ? (
              <div className="h-64 flex items-center justify-center font-bold text-slate-500 animate-pulse">Calculando receitas e despesas...</div>
            ) : dashboardError ? (
              <ErrorBox msg={dashboardError} />
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
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dashboardData.financial.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Saldo Geral</p>
                    <p className={`text-3xl font-black ${dashboardData.financial.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(dashboardData.financial.balance || 0)}</p>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Balanco Detalhado</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financialBarData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                        <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} tickFormatter={v => `R$${v}`} />
                        <RechartsTooltip cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }} formatter={v => formatCurrency(v)} contentStyle={tooltipStyle} />
                        <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- PRODUTIVIDADE ---- */}
        {activeReport === 'productivity' && (
          <div className="animate-fade-in space-y-8">
            {loadingDashboard ? (
              <div className="h-64 flex items-center justify-center font-bold text-slate-500 animate-pulse">Calculando metricas...</div>
            ) : dashboardError ? (
              <ErrorBox msg={dashboardError} />
            ) : dashboardData?.productivity && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Cards Criados', value: dashboardData.productivity.cards_created || 0, color: 'text-blue-500' },
                    { label: 'Movimentacoes', value: dashboardData.productivity.cards_moved || 0, color: 'text-purple-500' },
                    { label: 'Concluidos', value: dashboardData.productivity.current_completed || 0, color: 'text-emerald-500' },
                    { label: 'Atrasados', value: dashboardData.productivity.current_delayed || 0, color: dashboardData.productivity.current_delayed > 0 ? 'text-rose-500' : 'text-slate-500', alert: dashboardData.productivity.current_delayed > 0 },
                  ].map((m, i) => (
                    <div key={i} className={`p-6 rounded-2xl border shadow-sm text-center ${m.alert ? (isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200') : (isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200')}`}>
                      <p className={`text-2xl font-black ${m.color} ${m.alert ? 'animate-pulse' : ''}`}>{m.value}</p>
                      <p className={`text-xs font-bold uppercase mt-2 ${m.alert ? 'text-rose-500' : 'text-slate-500'}`}>{m.label}</p>
                    </div>
                  ))}
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-8 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="w-full md:w-1/2">
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Status Geral do Funil</h3>
                    <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Distribuicao em tempo real dos cards.</p>
                    <div className="space-y-4">
                      {productivityPieData.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} /><span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{entry.name}</span></div>
                          <span className="font-black text-lg">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 h-64">
                    {productivityPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={productivityPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{productivityPieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><RechartsTooltip contentStyle={tooltipStyle} /></PieChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center italic opacity-50">Sem dados.</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- TAGS ---- */}
        {activeReport === 'tags' && (
          <div className="animate-fade-in space-y-8">
            {loadingDashboard ? (
              <div className="h-64 flex items-center justify-center font-bold text-slate-500 animate-pulse">Contando etiquetas...</div>
            ) : dashboardError ? (
              <ErrorBox msg={dashboardError} />
            ) : dashboardData?.tags && (
              <div className={`p-8 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Etiquetas Mais Utilizadas</h3>
                <p className={`text-sm mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Frequencia de tags nos seus projetos.</p>
                {dashboardData.tags.length === 0 ? (
                  <div className="text-center py-12 italic opacity-50">Ainda sem etiquetas.</div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2 h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={dashboardData.tags} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({name, percent}) => `${name} (${(percent*100).toFixed(0)}%)`}>{dashboardData.tags.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><RechartsTooltip contentStyle={tooltipStyle} /></PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                      {dashboardData.tags.map((tag, i) => (
                        <div key={i} className={`p-4 rounded-xl border flex flex-col justify-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2 mb-2"><span className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: tag.color }} /><span className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tag.name}</span></div>
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
    </PageLayout>
  )
}