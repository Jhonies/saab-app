import api from './authService'

export const fetchClients   = ()         => api.get('/clients').then(r => r.data)
export const createClient   = (data)     => api.post('/clients', data).then(r => r.data)
export const updateClient   = (id, data) => api.patch(`/clients/${id}`, data).then(r => r.data)
export const deleteClient   = (id)       => api.delete(`/clients/${id}`)
