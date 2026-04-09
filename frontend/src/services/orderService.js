import api from './authService'

export const fetchOrders     = ()     => api.get('/orders').then(r => r.data)
export const fetchOrderById  = (id)   => api.get(`/orders/${id}`).then(r => r.data)
export const createOrder     = (data) => api.post('/orders', data).then(r => r.data)

export const updateOrderStatus = (id, status, lastStatusAt) =>
  api.patch(`/orders/${id}/status`, { status, lastStatusAt }).then(r => r.data)

export const confirmOrder  = (id, lastStatusAt) => api.patch(`/orders/${id}/status`, { status: 'CONFIRMED', lastStatusAt }).then(r => r.data)
export const separateOrder = (id, lastStatusAt) => api.patch(`/orders/${id}/separate`, { lastStatusAt }).then(r => r.data)
export const packOrder     = (id, itemWeights, lastStatusAt) => api.patch(`/orders/${id}/pack`, { itemWeights, lastStatusAt }).then(r => r.data)
export const loadOrder     = (id, lastStatusAt) => api.patch(`/orders/${id}/load`, { lastStatusAt }).then(r => r.data)
export const deliverOrder  = (id, lastStatusAt) => api.patch(`/orders/${id}/deliver`, { lastStatusAt }).then(r => r.data)

export const openInvoice = async (orderId) => {
  const res  = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
