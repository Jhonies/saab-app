import api from './authService'

export const fetchContainers = () =>
  api.get('/inventory/containers').then(r => r.data)

export const fetchProducts    = ()  => api.get('/inventory/products').then(r => r.data)
export const fetchAllProducts = ()  => api.get('/inventory/products?all=true').then(r => r.data)

export const updateContainer = (id, data) =>
  api.patch(`/inventory/containers/${id}`, data).then(r => r.data)

export const createProduct = (data) =>
  api.post('/inventory/products', data).then(r => r.data)

export const updateProduct = (id, data) =>
  api.patch(`/inventory/products/${id}`, data).then(r => r.data)

export const fetchProductStock = (id) =>
  api.get(`/inventory/products/${id}/stock`).then(r => r.data)

export const deleteProduct = (id) =>
  api.delete(`/inventory/products/${id}`)
