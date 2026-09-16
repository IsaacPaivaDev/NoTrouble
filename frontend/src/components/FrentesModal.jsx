import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { apiFetch } from '../api/client'
import { IconX, IconPlus } from '../utils/icons'

// Paleta sugerida — o input de cor continua livre, isto e so atalho.
const CORES = ['#1F5FA8', '#2E7A57', '#B45309', '#7C3AED', '#BE185D', '#0F766E', '#B91C1C', '#67737E']

const IconSeta = ({ cima = true, className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={cima ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
  </svg>
)
const IconLixeira = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function FrentesModal({ boardId, frentes, onFechar, onMudou }) {
  const { isDarkMode } = useTheme()
  const [lista, setLista] = useState(frentes)
  const [novoNome, setNovoNome] = useState('')
  const [novaCor, setNovaCor] = useState(CORES[0])
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const painelRef = useRef(null)
  const novoRef = useRef(null)

  useEffect(() => { setLista(frentes) }, [frentes])
  useEffect(() => { setTimeout(() => novoRef.current?.focus(), 80) }, [])

  useEffect(() => {
    const porTecla = (e) => { if (e.key === 'Escape') onFechar() }
    const porClique = (e) => { if (painelRef.current && !painelRef.current.contains(e.target)) onFechar() }
    window.addEventListener('keydown', porTecla)
    document.addEventListener('mousedown', porClique)
    return () => { window.removeEventListener('keydown', porTecla); document.removeEventListener('mousedown', porClique) }
  }, [onFechar])

  // Toda gravacao passa por aqui: mostra o erro do servidor em vez de um texto
  // generico, porque o 409 de nome duplicado precisa chegar ate a pessoa.
  const gravar = async (caminho, opcoes, aoTerminar) => {
    setOcupado(true); setErro(null)
    try {
      const res = await apiFetch(caminho, opcoes)
      if (!res.ok) {
        let msg = 'Nao foi possivel salvar. Tente de novo.'
        try { const j = await res.json(); if (j?.detail) msg = j.detail } catch { /* corpo vazio */ }
        setErro(msg)
        return false
      }
      aoTerminar?.(await res.json().catch(() => null))
      onMudou()
      return true
    } catch {
      setErro('Sem conexao com o servidor. Verifique a internet.')
      return false
    } finally {
      setOcupado(false)
    }
  }

  const criar = async () => {
    const nome = novoNome.trim()
    if (!nome) return
    const ok = await gravar(`/boards/${boardId}/frentes/`, {
      method: 'POST',
      body: JSON.stringify({ nome, cor: novaCor, ordem: lista.length }),
    })
    if (ok) { setNovoNome(''); novoRef.current?.focus() }
  }

  const salvarCampo = (frente, campos) => {
    const atual = { nome: frente.nome, cor: frente.cor, ordem: frente.ordem, ...campos }
    if (atual.nome === frente.nome && atual.cor === frente.cor && atual.ordem === frente.ordem) return
    gravar(`/frentes/${frente.id}/`, { method: 'PUT', body: JSON.stringify(atual) })
  }

  const mover = (indice, passo) => {
    const destino = indice + passo
    if (destino < 0 || destino >= lista.length) return
    const nova = [...lista]
    const [item] = nova.splice(indice, 1)
    nova.splice(destino, 0, item)
    setLista(nova)  // otimista: a ordem muda na hora
    gravar(`/boards/${boardId}/frentes/reorder/`, {
      method: 'PUT',
      body: JSON.stringify({ frente_ids: nova.map(f => f.id) }),
    })
  }

  const excluir = (frente) => {
    const texto = `Excluir a frente "${frente.nome}"?\n\nOs cards dela NAO serao apagados — eles voltam para "Sem frente".`
    if (!window.confirm(texto)) return
    gravar(`/frentes/${frente.id}/`, { method: 'DELETE' })
  }

  const fundo = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
  const txt = isDarkMode ? 'text-white' : 'text-slate-800'
  const txtFraco = isDarkMode ? 'text-slate-400' : 'text-slate-500'
  const foco = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  const campo = `px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors motion-reduce:transition-none ${foco} ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'}`
  const esquemaNativo = { colorScheme: isDarkMode ? 'dark' : 'light' }

  return (
    <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center p-3 md:p-6 bg-black/60 overflow-y-auto">
      <div ref={painelRef} role="dialog" aria-modal="true" aria-label="Frentes de trabalho"
           className={`w-full max-w-lg rounded-2xl border shadow-2xl my-auto ${fundo}`}>

        <header className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <h2 className={`font-black ${txt}`}>Frentes de trabalho</h2>
            <p className={`text-[11px] mt-0.5 ${txtFraco}`}>Valem so para este quadro</p>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className={`p-2 rounded-lg ${foco} ${txtFraco} hover:${txt}`}>
            <IconX className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5">
          {/* Criar ------------------------------------------------------- */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="color"
              value={novaCor}
              onChange={e => setNovaCor(e.target.value)}
              aria-label="Cor da nova frente"
              className={`w-9 h-9 rounded-lg border cursor-pointer shrink-0 bg-transparent ${foco} ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}
            />
            <input
              ref={novoRef}
              type="text"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') criar() }}
              placeholder="Nome da frente. Ex: Fiscal"
              maxLength={80}
              style={esquemaNativo}
              className={`${campo} flex-1 min-w-0`}
            />
            <button
              onClick={criar}
              disabled={ocupado || !novoNome.trim()}
              className={`px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center gap-1.5 shrink-0 transition-colors motion-reduce:transition-none ${foco}`}
            >
              <IconPlus className="w-3.5 h-3.5" /> Criar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {CORES.map(c => (
              <button
                key={c}
                onClick={() => setNovaCor(c)}
                aria-label={`Usar a cor ${c}`}
                className={`w-5 h-5 rounded-full transition-transform motion-reduce:transition-none ${foco} ${novaCor === c ? 'ring-2 ring-offset-2 ring-blue-500 ' + (isDarkMode ? 'ring-offset-slate-800' : 'ring-offset-white') : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {erro && (
            <p role="alert" className={`text-xs font-semibold mb-3 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
              {erro}
            </p>
          )}

          {/* Lista -------------------------------------------------------- */}
          {lista.length === 0 ? (
            <p className={`text-sm text-center italic py-6 ${txtFraco}`}>
              Nenhuma frente ainda. Crie a primeira acima e depois agrupe os cards por ela.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {lista.map((f, i) => (
                <li key={f.id} className={`flex items-center gap-2 p-2 rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                  <input
                    type="color"
                    defaultValue={f.cor}
                    onBlur={e => salvarCampo(f, { cor: e.target.value })}
                    aria-label={`Cor da frente ${f.nome}`}
                    className={`w-7 h-7 rounded border cursor-pointer shrink-0 bg-transparent ${foco} ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}
                  />
                  <input
                    type="text"
                    defaultValue={f.nome}
                    onBlur={e => salvarCampo(f, { nome: e.target.value.trim() || f.nome })}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    maxLength={80}
                    aria-label={`Nome da frente ${f.nome}`}
                    style={esquemaNativo}
                    className={`${campo} flex-1 min-w-0`}
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${f.nome}`}
                            className={`p-1.5 rounded-lg disabled:opacity-25 ${foco} ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <IconSeta cima />
                    </button>
                    <button onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label={`Descer ${f.nome}`}
                            className={`p-1.5 rounded-lg disabled:opacity-25 ${foco} ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}>
                      <IconSeta cima={false} />
                    </button>
                    <button onClick={() => excluir(f)} aria-label={`Excluir ${f.nome}`}
                            className={`p-1.5 rounded-lg ${foco} ${isDarkMode ? 'text-slate-500 hover:bg-red-900/40 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}>
                      <IconLixeira />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className={`text-[11px] mt-4 ${txtFraco}`}>
            Excluir uma frente nao apaga card nenhum: eles voltam para "Sem frente".
          </p>
        </div>
      </div>
    </div>
  )
}