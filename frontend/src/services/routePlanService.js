import api from './authService'

export const fetchRoutes              = (params)   => api.get('/routes', { params }).then(r => r.data)
export const fetchRouteById           = (id)       => api.get(`/routes/${id}`).then(r => r.data)
export const createRoute              = (data)     => api.post('/routes', data).then(r => r.data)
export const updateRoute              = (id, data) => api.patch(`/routes/${id}`, data).then(r => r.data)
export const deleteRoute              = (id)       => api.delete(`/routes/${id}`).then(r => r.data)
export const assignOrdersToRoute      = (id, orderIds) =>
  api.post(`/routes/${id}/assign-orders`, { orderIds }).then(r => r.data)
export const unassignOrderFromRoute   = (id, orderId) =>
  api.delete(`/routes/${id}/orders/${orderId}`).then(r => r.data)
export const fetchAssignableOrders    = ()         => api.get('/routes/assignable-orders').then(r => r.data)
