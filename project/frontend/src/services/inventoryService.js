import api from './authService'

export const fetchContainers = () =>
  api.get('/inventory/containers').then(r => r.data)

export const fetchProducts = () =>
  api.get('/inventory/products').then(r => r.data)

export const updateContainer = (id, data) =>
  api.patch(`/inventory/containers/${id}`, data).then(r => r.data)

export const createProduct = (data) =>
  api.post('/inventory/products', data).then(r => r.data)

export const updateProduct = (id, data) =>
  api.patch(`/inventory/products/${id}`, data).then(r => r.data)

export const deleteProduct = (id) =>
  api.delete(`/inventory/products/${id}`)
