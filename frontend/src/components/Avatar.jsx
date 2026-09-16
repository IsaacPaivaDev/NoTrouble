import { useState, useEffect } from 'react'
import { mediaUrl } from '../utils/media'
import { getInitials, getColorFromString } from '../utils/formatters'

/**
 * Avatar com queda automatica para as iniciais.
 *
 * Dois comportamentos que importam:
 *
 * 1. CARREGANDO != SEM FOTO. Enquanto currentUser ainda e nulo (logo apos um
 *    reload), nao ha nome nem username para montar inicial. Antes isso virava
 *    um "?" piscando na tela. Agora vira um bloco neutro, sem letra nenhuma.
 *
 * 2. Se a imagem existe no banco mas nao carrega, o onError cai nas iniciais E
 *    escreve no console o motivo provavel. O backend nao serve /media/ em
 *    producao e o disco do Render e efemero, entao a linha no banco costuma
 *    apontar para um arquivo que nao existe mais.
 */
export default function Avatar({
  url, firstName, lastName, username, nome,
  size = 'h-9 w-9', textSize = 'text-[10px]',
  rounded = 'rounded-full', className = '', title,
}) {
  const [falhou, setFalhou] = useState(false)
  useEffect(() => { setFalhou(false) }, [url])

  const rotulo = nome || [firstName, lastName].filter(Boolean).join(' ') || username || ''
  const temIdentidade = Boolean(rotulo)
  const mostrarImagem = Boolean(url) && !falhou

  const iniciais = (() => {
    const pelaLib = getInitials(firstName, lastName, username)
    if (pelaLib) return pelaLib
    const partes = String(rotulo).trim().split(/\s+/).filter(Boolean)
    if (!partes.length) return ''
    return partes.length === 1
      ? partes[0].slice(0, 2).toUpperCase()
      : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  })()

  const aoFalhar = () => {
    const alvo = mediaUrl(url)
    console.warn(
      `[Avatar] a imagem nao carregou: ${alvo}\n` +
      `O banco tem o caminho salvo, mas o arquivo nao foi servido. Causas provaveis:\n` +
      `  1. o backend nao registra a rota /media/ em producao (DEBUG=False desliga o static())\n` +
      `  2. o disco do Render foi recriado no ultimo deploy e o arquivo sumiu\n` +
      `Veja o que existe no disco agora em: ${alvo.replace(/\/media\/.*$/, '/media-diag/')}`
    )
    setFalhou(true)
  }

  // Sem foto E sem identidade = ainda carregando. Placeholder neutro, sem "?".
  if (!mostrarImagem && !temIdentidade) {
    return (
      <div
        aria-hidden="true"
        className={`${size} ${rounded} shrink-0 animate-pulse motion-reduce:animate-none ${className}`}
        style={{ backgroundColor: 'rgb(100 116 139 / 0.25)' }}
      />
    )
  }

  return (
    <div
      title={title || rotulo || undefined}
      className={`${size} ${rounded} shrink-0 overflow-hidden flex items-center justify-center font-bold text-white ${textSize} ${className}`}
      style={{ backgroundColor: mostrarImagem ? 'transparent' : (getColorFromString(username || rotulo) || '#3B82F6') }}
    >
      {mostrarImagem
        ? <img src={mediaUrl(url)} alt="" onError={aoFalhar} className="h-full w-full object-cover" />
        : iniciais}
    </div>
  )
}