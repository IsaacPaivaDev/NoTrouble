export const safeParseFloat = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const parsed = parseFloat(value)
  return isNaN(parsed) ? '' : parsed
}

export const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const prepareFinancialData = (estimatedValue, investedValue) => {
  return { 
    estimated_value: estimatedValue ? parseFloat(estimatedValue) : null, 
    invested_value: investedValue ? parseFloat(investedValue) : null 
  }
}

export const getInitials = (firstName, lastName, username) => {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (username) return username.substring(0, 2).toUpperCase()
  return '?'
}

export const getColorFromString = (str) => {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export const getPaymentIcon = (method) => {
  if (!method) return '💳'
  const lower = method.toLowerCase()
  if (lower.includes('pix')) return '🔑'
  if (lower.includes('cartão')) return '💳'
  if (lower.includes('boleto')) return '📋'
  if (lower.includes('transferência') || lower.includes('ted') || lower.includes('doc')) return '🏦'
  if (lower.includes('pendente')) return '⏳'
  return '💰'
}