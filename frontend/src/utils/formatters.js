export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ar-EG')
}

export const formatTime = (time) => {
  return new Date(time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

export const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
}