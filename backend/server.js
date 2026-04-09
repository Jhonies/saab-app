require('dotenv').config()
const path      = require('path')
const express   = require('express')
const cors      = require('cors')
const prisma    = require('./src/lib/prisma')
const authRoutes      = require('./src/routes/authRoutes')
const inventoryRoutes = require('./src/routes/inventoryRoutes')
const orderRoutes     = require('./src/routes/orderRoutes')
const routeRoutes     = require('./src/routes/routeRoutes')
const userRoutes       = require('./src/routes/userRoutes')
const clientRoutes     = require('./src/routes/clientRoutes')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : 'http://localhost:5173',
}))
app.use(express.json({ limit: '5mb' }))

app.use('/auth',      authRoutes)
app.use('/inventory', inventoryRoutes)
app.use('/orders',    orderRoutes)
app.use('/routes',    routeRoutes)
app.use('/users',       userRoutes)
app.use('/clients',     clientRoutes)

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    return res.status(503).json({ status: 'degraded', db: 'unreachable', error: err.message })
  }
})

/* ── Global error handler — impede crash por exceptions não tratadas ── */
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED]', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor.'
      : err.message,
  })
})

/* ── Serve frontend build (produção / ngrok) ── */
const clientBuild = path.join(__dirname, 'public')
app.use(express.static(clientBuild))
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Backend SAAB a correr em http://localhost:${PORT}`)
})
