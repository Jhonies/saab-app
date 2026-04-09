const OrderService   = require('../services/OrderService')
const ClientService  = require('../services/ClientService')
const InvoiceService = require('../services/InvoiceService')
const { createOrderSchema, packOrderSchema, updateStatusSchema } = require('../lib/schemas')

/* ── Create ── */
const createOrder = async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => i.message).join('; ')
    return res.status(400).json({ message: msg })
  }

  const { clientId, clientName, address, items } = parsed.data

  try {
    const order = await OrderService.createOrder({
      clientId:   clientId ?? null,
      clientName: clientName?.trim() || '',
      address:    address?.trim() || null,
      items,
      updatedById: req.user.sub,
    })
    return res.status(201).json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── List ── */
const listOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query
    const filters = status ? { status } : {}
    const orders = await OrderService.listOrders(filters, { page, limit })
    return res.json(orders)
  } catch (err) { next(err) }
}

/* ── Get by ID ── */
const getOrder = async (req, res, next) => {
  try {
    const order = await OrderService.getOrderById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' })
    return res.json(order)
  } catch (err) { next(err) }
}

/* ── List clients ── */
const listClients = async (_req, res, next) => {
  try {
    const clients = await ClientService.list()
    return res.json(clients)
  } catch (err) { next(err) }
}

/* ── Deliver ── */
const deliverOrder = async (req, res) => {
  try {
    const order = await OrderService.deliverOrder(req.params.id, {
      deliveredById: req.user.sub,
      lastStatusAt:  req.body.lastStatusAt,
    })
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Update status (CONFIRMED | CANCELLED) ── */
const updateStatus = async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => i.message).join('; ')
    return res.status(400).json({ message: msg })
  }

  const { status } = parsed.data

  try {
    const opts = { lastStatusAt: req.body.lastStatusAt }
    const order = status === 'CONFIRMED'
      ? await OrderService.confirmOrder(req.params.id, req.user.sub, opts)
      : await OrderService.cancelOrder(req.params.id, req.user.sub, opts)
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Separate (CONFIRMED → SEPARATING) ── */
const separateOrder = async (req, res) => {
  try {
    const order = await OrderService.separateOrder(req.params.id, req.user.sub, { lastStatusAt: req.body.lastStatusAt })
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Pack (SEPARATING → READY) ── */
const packOrder = async (req, res) => {
  const parsed = packOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => i.message).join('; ')
    return res.status(400).json({ message: msg })
  }

  const { itemWeights } = parsed.data
  try {
    const order = await OrderService.packOrder(req.params.id, req.user.sub, itemWeights, { lastStatusAt: req.body.lastStatusAt })
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Load (READY → IN_TRANSIT) ── */
const loadOrder = async (req, res) => {
  try {
    const order = await OrderService.loadOrder(req.params.id, req.user.sub, { lastStatusAt: req.body.lastStatusAt })
    return res.json(order)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Invoice ── */
const getInvoice = async (req, res) => {
  const order = await OrderService.getOrderById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' })

  if (order.status === 'PENDING') {
    return res.status(400).json({ message: 'Fatura só pode ser gerada após confirmação do pedido.' })
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
  separateOrder,
  packOrder,
  loadOrder,
}
