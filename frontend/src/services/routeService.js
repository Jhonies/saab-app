import api from './authService'

export const fetchMyRoutes = () =>
  api.get('/routes/mine').then(r => r.data)
