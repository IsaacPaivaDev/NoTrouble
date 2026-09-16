import { useMemo, useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Camada de fundo animada. CSS puro — sem canvas, sem biblioteca.
 *
 * NOTAS DE DESEMPENHO (a primeira versao engasgava; foi reescrita):
 *
 * 1. Estrelas por `background-image` de radial-gradients em ladrilho, NAO por
 *    box-shadow. Um span com 90 sombras espalhadas por 100vw/100vh tem area de
 *    pintura do tamanho da tela; animar opacity nele repinta tudo a cada
 *    quadro. O ladrilho e pintado UMA vez e repetido pela GPU.
 *
 * 2. A rolagem anda exatamente o tamanho do ladrilho, entao o loop e perfeito
 *    em qualquer altura de janela — sem emenda visivel.
 *
 * 3. As manchas so transladam. A versao anterior tinha `scale()` junto com
 *    `filter: blur(70px)`, o que obriga o navegador a re-rasterizar uma area
 *    borrada enorme a cada quadro. Blur estatico + translate e so composicao.
 *
 * 4. `will-change` promove cada camada a layer propria: as animacoes rodam no
 *    compositor, sem tocar em layout nem em paint.
 *
 * 5. A animacao para quando a aba sai de foco. Nao adianta gastar GPU (e
 *    bateria de notebook) desenhando estrela que ninguem esta vendo.
 *
 * `prefers-reduced-motion` congela tudo e deixa o fundo estatico.
 */

const aleatorio = (semente) => {
  const x = Math.sin(semente) * 10000
  return x - Math.floor(x)
}

// Um ladrilho de estrelas como background-image. Pintado uma vez, repetido pela
// GPU — e o que torna isso barato.
const ladrilho = (quantidade, semente, lado) => {
  const partes = []
  for (let i = 0; i < quantidade; i++) {
    const x = (aleatorio(i + semente) * 100).toFixed(1)
    const y = (aleatorio(i + semente + 0.5) * 100).toFixed(1)
    const r = (0.6 + aleatorio(i + semente + 0.9) * 1.1).toFixed(2)
    partes.push(`radial-gradient(${r}px ${r}px at ${x}% ${y}%, #fff 100%, transparent 100%)`)
  }
  return { imagem: partes.join(','), lado }
}

export default function AnimatedBackground() {
  const { background, isDarkMode } = useTheme()
  const [visivel, setVisivel] = useState(true)

  useEffect(() => {
    const aoTrocar = () => setVisivel(!document.hidden)
    document.addEventListener('visibilitychange', aoTrocar)
    return () => document.removeEventListener('visibilitychange', aoTrocar)
  }, [])

  const ceus = useMemo(() => [
    { ...ladrilho(26, 1, 520), dur: 170, brilho: 11, alfa: 0.4 },
    { ...ladrilho(20, 140, 700), dur: 110, brilho: 8, alfa: 0.65 },
    { ...ladrilho(14, 320, 900), dur: 70, brilho: 5.5, alfa: 0.95 },
  ], [])

  if (background === 'nenhum') return null

  const op = isDarkMode ? 1 : 0.4
  const estado = visivel ? 'running' : 'paused'

  return (
    <div className="nt-bg pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
      <style>{`
        .nt-bg{--nt-ac:rgb(var(--ac-500,59 130 246));--nt-ac4:rgb(var(--ac-400,96 165 250));--nt-op:${op};contain:strict}
        @keyframes nt-rola{to{transform:translate3d(0,calc(-1 * var(--nt-lado)),0)}}
        @keyframes nt-brilha{0%,100%{opacity:calc(var(--nt-alfa) * .45 * var(--nt-op))}50%{opacity:calc(var(--nt-alfa) * var(--nt-op))}}
        @keyframes nt-vaga{0%{transform:translate3d(0,0,0);opacity:0}12%{opacity:.85}88%{opacity:.6}100%{transform:translate3d(2vw,-105vh,0);opacity:0}}
        @keyframes nt-anda{0%{transform:translate3d(0,0,0)}25%{transform:translate3d(7vw,-5vh,0)}50%{transform:translate3d(2vw,6vh,0)}75%{transform:translate3d(-6vw,2vh,0)}100%{transform:translate3d(0,0,0)}}

        .nt-ceu{position:absolute;left:0;top:0;width:100%;height:calc(100% + var(--nt-lado));
                background-repeat:repeat;background-size:var(--nt-lado) var(--nt-lado);
                will-change:transform,opacity;backface-visibility:hidden}
        .nt-mancha{position:absolute;border-radius:9999px;will-change:transform;backface-visibility:hidden}
        .nt-vaga{position:absolute;border-radius:9999px;will-change:transform,opacity}

        @media (prefers-reduced-motion: reduce){ .nt-bg *{animation:none !important} }
      `}</style>

      {background === 'estrelas' && ceus.map((c, i) => (
        <div key={i} className="nt-ceu"
             style={{
               backgroundImage: c.imagem,
               '--nt-lado': `${c.lado}px`,
               '--nt-alfa': c.alfa,
               opacity: c.alfa * op,
               animation: `nt-rola ${c.dur}s linear infinite, nt-brilha ${c.brilho}s ease-in-out ${i * 1.7}s infinite`,
               animationPlayState: estado,
             }} />
      ))}

      {background === 'aurora' && [
        { t: '46vw', top: '-14vh', left: '-10vw', cor: 'var(--nt-ac)', a: 0.30, dur: 44, atraso: 0 },
        { t: '38vw', bottom: '-16vh', right: '-8vw', cor: 'var(--nt-ac4)', a: 0.24, dur: 58, atraso: -15 },
        { t: '30vw', top: '36%', left: '44%', cor: 'var(--nt-ac)', a: 0.16, dur: 72, atraso: -30 },
      ].map((m, i) => (
        <div key={i} className="nt-mancha"
             style={{
               width: m.t, height: m.t, top: m.top, bottom: m.bottom, left: m.left, right: m.right,
               background: m.cor, opacity: m.a * op, filter: 'blur(64px)',
               animation: `nt-anda ${m.dur}s ease-in-out ${m.atraso}s infinite`,
               animationPlayState: estado,
             }} />
      ))}

      {background === 'vagalumes' && Array.from({ length: 16 }, (_, i) => {
        const esq = (aleatorio(i + 7) * 100).toFixed(1)
        const dur = 20 + aleatorio(i + 21) * 24
        const tam = 2 + aleatorio(i + 88) * 2.5
        return (
          <span key={i} className="nt-vaga"
                style={{
                  bottom: '-6vh', left: `${esq}vw`, width: tam, height: tam,
                  background: 'var(--nt-ac4)', boxShadow: '0 0 7px 1px var(--nt-ac4)',
                  opacity: 0.7 * op,
                  animation: `nt-vaga ${dur}s linear ${-aleatorio(i + 55) * dur}s infinite`,
                  animationPlayState: estado,
                }} />
        )
      })}

      {background === 'malha' && [
        { t: '58vw', top: '-22%', left: '-12%', cor: 'var(--nt-ac)', a: 0.20, dur: 80, atraso: 0 },
        { t: '48vw', bottom: '-20%', right: '-10%', cor: 'var(--nt-ac4)', a: 0.18, dur: 96, atraso: -34 },
      ].map((m, i) => (
        <div key={i} className="nt-mancha"
             style={{
               width: m.t, height: m.t, top: m.top, bottom: m.bottom, left: m.left, right: m.right,
               background: m.cor, opacity: m.a * op, filter: 'blur(72px)',
               animation: `nt-anda ${m.dur}s ease-in-out ${m.atraso}s infinite`,
               animationPlayState: estado,
             }} />
      ))}
    </div>
  )
}