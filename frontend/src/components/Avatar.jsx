import { useState, useEffect } from 'react'
import { mediaUrl } from '../utils/media'
import { getInitials, getColorFromString } from '../utils/formatters'

/**
 * Avatar com queda automatica para as iniciais.
 *
 * Existe por um motivo concreto: o backend nao serve /media/ em producao
 * (django.conf.urls.static.static() devolve lista vazia quando DEBUG=False) e o
 * disco do Render e efemero, entao arquivo enviado some no deploy seguinte. A
 * linha no banco continua apontando para um avatar que nao existe mais, e o
 * <img> mostrava o icone de imagem quebrada.
 *
 * Aqui, o onError troca para as iniciais coloridas. Quando o armazenamento for
 * para o Supabase Storage, este componente continua valendo sem mudanca.
 */
export default function Avatar({
  url, firstName, lastName, username, nome,
  size = 'h-9 w-9', textSize = 'text-[10px]',
  rounded = 'rounded-full', className = '', title,
}) {
  const [falhou, setFalhou] = useState(false)
  useEffect(() => { setFalhou(false) }, [url])

  const rotulo = nome || [firstName, lastName].filter(Boolean).join(' ') || username || ''
  const mostrarImagem = url && !falhou

  const iniciais = (() => {
    const pelaLib = getInitials(firstName, lastName, username)
    if (pelaLib) return pelaLib
    const partes = String(rotulo).trim().split(/\s+/).filter(Boolean)
    if (!partes.length) return '?'
    return partes.length === 1
      ? partes[0].slice(0, 2).toUpperCase()
      : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  })()

  return (
    <div
      title={title || rotulo || undefined}
      className={`${size} ${rounded} shrink-0 overflow-hidden flex items-center justify-center font-bold text-white ${textSize} ${className}`}
      style={{ backgroundColor: mostrarImagem ? 'transparent' : (getColorFromString(username || rotulo) || '#3B82F6') }}
    >
      {mostrarImagem
        ? <img src={mediaUrl(url)} alt="" onError={() => setFalhou(true)} className="h-full w-full object-cover" />
        : iniciais}
    </div>
  )
}