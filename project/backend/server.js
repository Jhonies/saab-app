require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const authRoutes      = require('./src/routes/authRoutes')
const inventoryRoutes = require('./src/routes/inventoryRoutes')
const orderRoutes     = require('./src/routes/orderRoutes')
const routeRoutes     = require('./src/routes/routeRoutes')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/auth',      authRoutes)
app.use('/inventory', inventoryRoutes)
app.use('/orders',    orderRoutes)
app.use('/routes',    routeRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Backend SAAB a correr em http://localhost:${PORT}`)
})
