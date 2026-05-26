import { API_BASE_URL } from '../api/client'

function getMediaBase() {
  return API_BASE_URL.replace(/\/api\/?$/, '')
}

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getMediaBase()}${normalized}`
}