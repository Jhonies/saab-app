import api from './authService'

export const fetchUsers    = ()         => api.get('/users').then(r => r.data)
export const createUser    = (data)     => api.post('/users', data).then(r => r.data)
export const updateUser    = (id, data) => api.patch(`/users/${id}`, data).then(r => r.data)
