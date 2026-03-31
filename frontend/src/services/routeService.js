import api from './authService'

export const fetchDailyRoute = () =>
  api.get('/routes/daily').then(r => r.data)
