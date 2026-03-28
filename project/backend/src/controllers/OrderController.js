const OrderService   = require('../services/OrderService')
const UserService    = require('../services/UserService')
const InvoiceService = require('../services/InvoiceService')

/* ── Create ── */
const createOrder = async (req, res) => {
  const { clientId, containerId, productId, quantity, weightKg } = req.body

  if (!clientId || !containerId || !productId || !quantity) {
    return res.status(400).json({ message: 'Campos obrigatórios: clientId, containerId, productId, quantity.' })
  }

  const qty = Number(quantity)
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Quantidade deve ser um inteiro positivo.' })
  }

  try {
    const order = await OrderService.createOrder({
      clientId:    Number(clientId),
      containerId: Number(containerId),
      productId:   Number(productId),
      quantity:    qty,
      weightKg:    weightKg != null ? Number(weightKg) : 0,
    })
    return res.status(201).json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── List ── */
const listOrders = async (req, res) => {
  const filters = req.user.role === 'CLIENTE' ? { clientId: req.user.sub } : {}
  const orders  = await OrderService.listOrders(filters)
  return res.json(orders)
}

/* ── Get by ID ── */
const getOrder = async (req, res) => {
  const order = await OrderService.getOrderById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' })

  if (req.user.role === 'CLIENTE' && order.clientId !== req.user.sub) {
    return res.status(403).json({ message: 'Acesso negado.' })
  }
  return res.json(order)
}

/* ── List clients ── */
const listClients = async (_req, res) => {
  const clients = await UserService.listClients()
  return res.json(clients)
}

/* ── Deliver ── */
const deliverOrder = async (req, res) => {
  const { signature } = req.body

  try {
    const order = await OrderService.deliverOrder(req.params.id, {
      signature,
      deliveredById: req.user.sub,
    })
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Update status (CONFIRMED | CANCELLED) ── */
const updateStatus = async (req, res) => {
  const { status } = req.body
  const VALID = ['CONFIRMED', 'CANCELLED']

  if (!status || !VALID.includes(status)) {
    return res.status(400).json({ message: `Status deve ser: ${VALID.join(' | ')}.` })
  }

  try {
    const order = status === 'CONFIRMED'
      ? await OrderService.confirmOrder(req.params.id)
      : await OrderService.cancelOrder(req.params.id)
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Invoice ── */
const getInvoice = async (req, res) => {
  const order = await OrderService.getOrderById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' })

  if (req.user.role === 'CLIENTE' && order.clientId !== req.user.sub) {
    return res.status(403).json({ message: 'Acesso negado.' })
  }

  const filename = `fatura-saab-${String(order.id).padStart(6, '0')}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`)

  InvoiceService.generateInvoice(order, res)
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  listClients,
  deliverOrder,
  updateStatus,
  getInvoice,
}
