import { createContext, useState, useContext, useEffect, useMemo } from 'react'

/**
 * Motor de tema do NoTrouble.
 *
 * O app inteiro escreve `blue-500`, `blue-600` etc. direto nas classes Tailwind
 * — sao umas 200 ocorrencias espalhadas por todas as paginas. Em vez de trocar
 * uma por uma (e deixar passar as que nao estao aqui), este contexto injeta um
 * <style> no fim do <head> redefinindo o que a escala `blue-*` SIGNIFICA.
 *
 * Como esse <style> entra depois da folha do Tailwind, ele ganha por ordem de
 * origem, sem precisar de !important. Resultado: trocar o acento repinta o app
 * todo, incluindo telas que nao foram tocadas.
 */

const ThemeContext = createContext()

// Paletas oficiais do Tailwind — combinam com o slate das superficies.
const PALETAS = {
  azul:      { rotulo: 'Azul',      escala: { 50:'239 246 255',100:'219 234 254',200:'191 219 254',300:'147 197 253',400:'96 165 250',500:'59 130 246',600:'37 99 235',700:'29 78 216',800:'30 64 175',900:'30 58 138',950:'23 37 84' } },
  indigo:    { rotulo: 'Indigo',    escala: { 50:'238 242 255',100:'224 231 255',200:'199 210 254',300:'165 180 252',400:'129 140 248',500:'99 102 241',600:'79 70 229',700:'67 56 202',800:'55 48 163',900:'49 46 129',950:'30 27 75' } },
  violeta:   { rotulo: 'Violeta',   escala: { 50:'245 243 255',100:'237 233 254',200:'221 214 254',300:'196 181 253',400:'167 139 250',500:'139 92 246',600:'124 58 237',700:'109 40 217',800:'91 33 182',900:'76 29 149',950:'46 16 101' } },
  esmeralda: { rotulo: 'Esmeralda', escala: { 50:'236 253 245',100:'209 250 229',200:'167 243 208',300:'110 231 183',400:'52 211 153',500:'16 185 129',600:'5 150 105',700:'4 120 87',800:'6 95 70',900:'6 78 59',950:'2 44 34' } },
  teal:      { rotulo: 'Teal',      escala: { 50:'240 253 250',100:'204 251 241',200:'153 246 228',300:'94 234 212',400:'45 212 191',500:'20 184 166',600:'13 148 136',700:'15 118 110',800:'17 94 89',900:'19 78 74',950:'4 47 46' } },
  ciano:     { rotulo: 'Ciano',     escala: { 50:'236 254 255',100:'207 250 254',200:'165 243 252',300:'103 232 249',400:'34 211 238',500:'6 182 212',600:'8 145 178',700:'14 116 144',800:'21 94 117',900:'22 78 99',950:'8 51 68' } },
  ambar:     { rotulo: 'Ambar',     escala: { 50:'255 251 235',100:'254 243 199',200:'253 230 138',300:'252 211 77',400:'251 191 36',500:'245 158 11',600:'217 119 6',700:'180 83 9',800:'146 64 14',900:'120 53 15',950:'69 26 3' } },
  rose:      { rotulo: 'Rose',      escala: { 50:'255 241 242',100:'255 228 230',200:'254 205 211',300:'253 164 175',400:'251 113 133',500:'244 63 94',600:'225 29 72',700:'190 18 60',800:'159 18 57',900:'136 19 55',950:'76 5 25' } },
}

const FUNDOS = {
  nenhum:     { rotulo: 'Liso',      descricao: 'Sem movimento' },
  estrelas:   { rotulo: 'Estrelas',  descricao: 'Ceu com parallax lento' },
  aurora:     { rotulo: 'Aurora',    descricao: 'Manchas que deslizam' },
  vagalumes:  { rotulo: 'Vagalumes', descricao: 'Pontos subindo' },
  malha:      { rotulo: 'Malha',     descricao: 'Gradiente que respira' },
}

const ESCALA = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const OPACIDADES = [10, 20, 25, 30, 40, 50, 60]
const VARIANTES = ['hover', 'focus', 'focus-visible', 'group-hover']

function montarCSS(escala) {
  const r = []
  r.push(`:root{${ESCALA.map(n => `--ac-${n}:${escala[n]}`).join(';')}}`)

  for (const n of ESCALA) {
    const c = escala[n]
    r.push(`.bg-blue-${n}{background-color:rgb(${c} / var(--tw-bg-opacity,1))}`)
    r.push(`.text-blue-${n}{color:rgb(${c} / var(--tw-text-opacity,1))}`)
    r.push(`.border-blue-${n}{border-color:rgb(${c} / var(--tw-border-opacity,1))}`)
    r.push(`.ring-blue-${n}{--tw-ring-color:rgb(${c} / var(--tw-ring-opacity,1))}`)
    r.push(`.from-blue-${n}{--tw-gradient-from:rgb(${c}) var(--tw-gradient-from-position);--tw-gradient-to:rgb(${c} / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}`)
    r.push(`.via-blue-${n}{--tw-gradient-to:rgb(${c} / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),rgb(${c}) var(--tw-gradient-via-position),var(--tw-gradient-to)}`)
    r.push(`.to-blue-${n}{--tw-gradient-to:rgb(${c}) var(--tw-gradient-to-position)}`)

    for (const o of OPACIDADES) {
      const a = o / 100
      r.push(`.bg-blue-${n}\\/${o}{background-color:rgb(${c} / ${a})}`)
      r.push(`.text-blue-${n}\\/${o}{color:rgb(${c} / ${a})}`)
      r.push(`.border-blue-${n}\\/${o}{border-color:rgb(${c} / ${a})}`)
      r.push(`.ring-blue-${n}\\/${o}{--tw-ring-color:rgb(${c} / ${a})}`)
    }

    // hover:bg-blue-700 vira `.hover\:bg-blue-700:hover` — seletor diferente,
    // entao precisa de regra propria, senao o hover continua azul.
    for (const v of VARIANTES) {
      const alvo = v === 'group-hover' ? '.group:hover ' : ''
      const sufixo = v === 'group-hover' ? '' : `:${v.replace('focus-visible', 'focus-visible')}`
      r.push(`${alvo}.${v.replace(':', '\\:')}\\:bg-blue-${n}${sufixo}{background-color:rgb(${c} / var(--tw-bg-opacity,1))}`)
      r.push(`${alvo}.${v.replace(':', '\\:')}\\:text-blue-${n}${sufixo}{color:rgb(${c} / var(--tw-text-opacity,1))}`)
      r.push(`${alvo}.${v.replace(':', '\\:')}\\:border-blue-${n}${sufixo}{border-color:rgb(${c} / var(--tw-border-opacity,1))}`)
      r.push(`${alvo}.${v.replace(':', '\\:')}\\:ring-blue-${n}${sufixo}{--tw-ring-color:rgb(${c} / var(--tw-ring-opacity,1))}`)
    }
  }
  return r.join('')
}

const ler = (chave, padrao) => {
  try { return localStorage.getItem(chave) || padrao } catch { return padrao }
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const salvo = ler('notrouble_theme', null)
    return salvo !== null ? salvo === 'dark' : true
  })
  const [accent, setAccentState] = useState(() => {
    const salvo = ler('notrouble_accent', 'azul')
    return PALETAS[salvo] ? salvo : 'azul'
  })
  const [background, setBackgroundState] = useState(() => {
    const salvo = ler('notrouble_bg_anim', 'estrelas')
    return FUNDOS[salvo] ? salvo : 'estrelas'
  })

  useEffect(() => {
    const root = document.documentElement
    try { localStorage.setItem('notrouble_theme', isDarkMode ? 'dark' : 'light') } catch { /* modo privado */ }
    root.style.colorScheme = isDarkMode ? 'dark' : 'light'
    root.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    try { localStorage.setItem('notrouble_accent', accent) } catch { /* modo privado */ }

    let tag = document.getElementById('notrouble-accent')
    if (!tag) {
      tag = document.createElement('style')
      tag.id = 'notrouble-accent'
      document.head.appendChild(tag)   // no fim do head: vence o Tailwind por ordem
    }
    tag.textContent = montarCSS(PALETAS[accent].escala)
  }, [accent])

  useEffect(() => {
    try { localStorage.setItem('notrouble_bg_anim', background) } catch { /* modo privado */ }
  }, [background])

  const valor = useMemo(() => ({
    isDarkMode,
    toggleTheme: () => setIsDarkMode(v => !v),
    accent,
    setAccent: (k) => { if (PALETAS[k]) setAccentState(k) },
    accents: Object.entries(PALETAS).map(([chave, p]) => ({ chave, rotulo: p.rotulo, hex: `rgb(${p.escala[500]})` })),
    background,
    setBackground: (k) => { if (FUNDOS[k]) setBackgroundState(k) },
    backgrounds: Object.entries(FUNDOS).map(([chave, f]) => ({ chave, ...f })),
  }), [isDarkMode, accent, background])

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)