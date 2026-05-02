const RoutePlanService = require('../services/RoutePlanService')
const { z } = require('zod')

const createRouteSchema = z.object({
  name:         z.string().min(1, 'Nome é obrigatório.'),
  region:       z.string().nullish(),
  driverId:     z.number().int().positive().nullish(),
  scheduledFor: z.string().nullish(),
  notes:        z.string().nullish(),
})

const updateRouteSchema = z.object({
  name:         z.string().min(1).optional(),
  region:       z.string().nullish(),
  driverId:     z.number().int().positive().nullable().optional(),
  scheduledFor: z.string().nullable().optional(),
  notes:        z.string().nullish(),
  status:       z.enum(['DRAFT', 'READY', 'IN_TRANSIT', 'COMPLETED']).optional(),
})

const assignOrdersSchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1, 'orderIds[] não pode ser vazio.'),
})

const list = async (req, res, next) => {
  try {
    const routes = await RoutePlanService.listRoutes({ status: req.query.status })
    return res.json(routes)
  } catch (err) { next(err) }
}

const getOne = async (req, res, next) => {
  try {
    const route = await RoutePlanService.getRoute(req.params.id)
    if (!route) return res.status(404).json({ message: 'Rota não encontrada.' })
    return res.json(route)
  } catch (err) { next(err) }
}

const create = async (req, res) => {
  const parsed = createRouteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join('; ') })
  }
  try {
    const route = await RoutePlanService.createRoute({ ...parsed.data, createdById: req.user.sub })
    return res.status(201).json(route)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const update = async (req, res) => {
  const parsed = updateRouteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join('; ') })
  }
  try {
    const route = await RoutePlanService.updateRoute(req.params.id, parsed.data)
    return res.json(route)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const remove = async (req, res) => {
  try {
    const result = await RoutePlanService.deleteRoute(req.params.id)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const assignOrders = async (req, res) => {
  const parsed = assignOrdersSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join('; ') })
  }
  try {
    const route = await RoutePlanService.assignOrders(req.params.id, parsed.data.orderIds)
    return res.json(route)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const unassignOrder = async (req, res) => {
  try {
    const route = await RoutePlanService.unassignOrder(req.params.id, req.params.orderId)
    return res.json(route)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const listAssignableOrders = async (_req, res, next) => {
  try {
    const orders = await RoutePlanService.listAssignableOrders()
    return res.json(orders)
  } catch (err) { next(err) }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  assignOrders,
  unassignOrder,
  listAssignableOrders,
}
