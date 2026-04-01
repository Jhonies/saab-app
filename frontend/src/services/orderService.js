import api from './authService'

export const fetchClients    = ()     => api.get('/orders/clients').then(r => r.data)
export const fetchOrders     = ()     => api.get('/orders').then(r => r.data)
export const fetchMyOrders   = ()     => api.get('/orders').then(r => r.data)
export const fetchOrderById  = (id)   => api.get(`/orders/${id}`).then(r => r.data)
export const createOrder     = (data) => api.post('/orders', data).then(r => r.data)

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then(r => r.data)

export const confirmOrder  = (id) => api.patch(`/orders/${id}/status`, { status: 'CONFIRMED' }).then(r => r.data)
export const separateOrder = (id) => api.patch(`/orders/${id}/separate`).then(r => r.data)
export const packOrder     = (id, weightKg) => api.patch(`/orders/${id}/pack`, { weightKg }).then(r => r.data)
export const loadOrder     = (id) => api.patch(`/orders/${id}/load`).then(r => r.data)
export const deliverOrder  = (id) => api.patch(`/orders/${id}/deliver`, {}).then(r => r.data)
export const signOrder     = (id, signature) => api.patch(`/orders/${id}/sign`, { signature }).then(r => r.data)

export const openInvoice = (orderId) => {
  const token   = localStorage.getItem('token')
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  // Abre o PDF numa nova aba passando o token como query param
  window.open(`${baseURL}/orders/${orderId}/invoice?token=${token}`, '_blank')
}
