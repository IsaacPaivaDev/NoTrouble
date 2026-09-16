import { useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Camada de fundo animada. CSS puro — sem canvas, sem biblioteca.
 *
 * Tudo anima so `transform` e `opacity`, que a GPU resolve sem repintar layout.
 * A camada e `pointer-events-none` e fica atras do conteudo, entao nao rouba
 * clique nem foco de nada.
 *
 * `prefers-reduced-motion` para toda a animacao e deixa o fundo estatico: quem
 * tem sensibilidade a movimento usa o sistema o dia inteiro sem passar mal.
 * Isso vale para todos os modos, inclusive o brilho das estrelas.
 */

const aleatorio = (semente) => {
  // PRNG simples e deterministico: o ceu nao muda de lugar a cada render.
  let x = Math.sin(semente) * 10000
  return x - Math.floor(x)
}

const campoDeEstrelas = (quantidade, deslocamento) => {
  const pontos = []
  for (let i = 0; i < quantidade; i++) {
    const x = (aleatorio(i + deslocamento) * 100).toFixed(2)
    const y = (aleatorio(i + deslocamento + 0.5) * 100).toFixed(2)
    pontos.push(`${x}vw ${y}vh`)
  }
  return pontos.join(', ')
}

export default function AnimatedBackground() {
  const { background, isDarkMode } = useTheme()

  const ceus = useMemo(() => ({
    perto: campoDeEstrelas(40, 1),
    meio: campoDeEstrelas(60, 100),
    longe: campoDeEstrelas(90, 200),
  }), [])

  if (background === 'nenhum') return null

  const op = isDarkMode ? 1 : 0.45   // no tema claro o fundo recua

  return (
    <div className="nt-bg pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
      <style>{`
        .nt-bg{--nt-ac:rgb(var(--ac-500,59 130 246));--nt-ac4:rgb(var(--ac-400,96 165 250));--nt-op:${op}}
        @keyframes nt-flutua{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-100vh,0)}}
        @keyframes nt-brilha{0%,100%{opacity:.25}50%{opacity:1}}
        @keyframes nt-desliza{0%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(6vw,-4vh,0) scale(1.15)}66%{transform:translate3d(-5vw,5vh,0) scale(.9)}100%{transform:translate3d(0,0,0) scale(1)}}
        @keyframes nt-respira{0%,100%{transform:scale(1) rotate(0deg);opacity:.5}50%{transform:scale(1.25) rotate(8deg);opacity:.85}}
        @keyframes nt-sobe{0%{transform:translate3d(0,10vh,0);opacity:0}15%{opacity:.9}85%{opacity:.7}100%{transform:translate3d(2vw,-100vh,0);opacity:0}}

        .nt-camada{position:absolute;inset:0;will-change:transform}
        .nt-estrela{position:absolute;top:0;left:0;border-radius:9999px;background:#fff}
        .nt-borrao{position:absolute;border-radius:9999px;filter:blur(70px);will-change:transform,opacity}

        @media (prefers-reduced-motion: reduce){
          .nt-bg *{animation:none !important}
        }
      `}</style>

      {background === 'estrelas' && (
        <>
          {[
            { campo: ceus.longe, tam: 1, dur: 150, brilho: 9, alfa: 0.45 },
            { campo: ceus.meio, tam: 1.6, dur: 95, brilho: 6, alfa: 0.7 },
            { campo: ceus.perto, tam: 2.4, dur: 60, brilho: 4, alfa: 1 },
          ].map((c, i) => (
            <div key={i} className="nt-camada" style={{ animation: `nt-flutua ${c.dur}s linear infinite`, opacity: `calc(${c.alfa} * var(--nt-op))` }}>
              {[0, 1].map(j => (
                <span key={j} className="nt-estrela"
                      style={{
                        width: c.tam, height: c.tam,
                        boxShadow: c.campo,
                        transform: `translateY(${j * 100}vh)`,
                        animation: `nt-brilha ${c.brilho}s ease-in-out ${i * 1.3}s infinite`,
                      }} />
              ))}
            </div>
          ))}
        </>
      )}

      {background === 'aurora' && (
        <>
          <div className="nt-borrao" style={{ width: '46vw', height: '46vw', top: '-12vh', left: '-8vw', background: 'var(--nt-ac)', opacity: `calc(.33 * var(--nt-op))`, animation: 'nt-desliza 34s ease-in-out infinite' }} />
          <div className="nt-borrao" style={{ width: '38vw', height: '38vw', bottom: '-14vh', right: '-6vw', background: 'var(--nt-ac4)', opacity: `calc(.26 * var(--nt-op))`, animation: 'nt-desliza 46s ease-in-out -12s infinite reverse' }} />
          <div className="nt-borrao" style={{ width: '30vw', height: '30vw', top: '38%', left: '42%', background: 'var(--nt-ac)', opacity: `calc(.18 * var(--nt-op))`, animation: 'nt-desliza 58s ease-in-out -26s infinite' }} />
        </>
      )}

      {background === 'vagalumes' && (
        <>
          {Array.from({ length: 26 }, (_, i) => {
            const esq = (aleatorio(i + 7) * 100).toFixed(2)
            const dur = 16 + aleatorio(i + 21) * 22
            const atraso = -aleatorio(i + 55) * dur
            const tam = 2 + aleatorio(i + 88) * 3
            return (
              <span key={i}
                    style={{
                      position: 'absolute', bottom: 0, left: `${esq}vw`,
                      width: tam, height: tam, borderRadius: 9999,
                      background: 'var(--nt-ac4)',
                      boxShadow: '0 0 8px 1px var(--nt-ac4)',
                      opacity: `calc(.7 * var(--nt-op))`,
                      animation: `nt-sobe ${dur}s linear ${atraso}s infinite`,
                    }} />
            )
          })}
        </>
      )}

      {background === 'malha' && (
        <>
          <div className="nt-borrao" style={{ width: '60vw', height: '60vw', top: '-20%', left: '-10%', background: 'var(--nt-ac)', opacity: `calc(.22 * var(--nt-op))`, animation: 'nt-respira 26s ease-in-out infinite' }} />
          <div className="nt-borrao" style={{ width: '50vw', height: '50vw', bottom: '-18%', right: '-8%', background: 'var(--nt-ac4)', opacity: `calc(.2 * var(--nt-op))`, animation: 'nt-respira 32s ease-in-out -9s infinite reverse' }} />
        </>
      )}
    </div>
  )
}