import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta token JWT em todos os pedidos autenticados
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password })

export const registerUser = (data) =>
  api.post('/auth/register', data).then(r => r.data)

export const fetchUsers = (role) =>
  api.get(`/auth/users${role ? `?role=${role}` : ''}`).then(r => r.data)

export default api
