const prisma = require('../lib/prisma')

const ROUTE_INCLUDE = {
  driver: { select: { id: true, name: true, email: true } },
  orders: {
    select: {
      id: true, clientName: true, status: true, address: true, totalBoxes: true,
      deliveryWindowStart: true, deliveryWindowEnd: true, deliveryType: true,
    },
    orderBy: { id: 'asc' },
  },
}

const VALID_STATUS = new Set(['DRAFT', 'READY', 'IN_TRANSIT', 'COMPLETED'])

const assertValidDriver = async (tx, driverId) => {
  if (driverId == null) return
  const driver = await tx.user.findUnique({ where: { id: Number(driverId) } })
  if (!driver) throw Object.assign(new Error('Motorista não encontrado.'), { status: 404 })
  if (driver.role !== 'MOTORISTA') {
    throw Object.assign(new Error('Utilizador atribuído não tem role MOTORISTA.'), { status: 400 })
  }
}

/* ── List ── */
const listRoutes = async ({ status } = {}) => {
  const where = {}
  if (status) where.status = status
  return prisma.route.findMany({
    where,
    include: ROUTE_INCLUDE,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
}

/* ── Get by ID ── */
const getRoute = (id) =>
  prisma.route.findUnique({ where: { id: Number(id) }, include: ROUTE_INCLUDE })

/* ── Create ── */
const createRoute = async ({ name, region, driverId, scheduledFor, notes, createdById }) => {
  return prisma.$transaction(async (tx) => {
    if (driverId != null) await assertValidDriver(tx, driverId)
    return tx.route.create({
      data: {
        name:         name.trim(),
        region:       (region || '').trim(),
        status:       'DRAFT',
        driverId:     driverId ?? null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        notes:        (notes || '').trim(),
        createdById:  createdById ?? null,
      },
      include: ROUTE_INCLUDE,
    })
  })
}

/* ── Update ── */
const updateRoute = async (id, { name, region, driverId, scheduledFor, notes, status }) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.route.findUnique({ where: { id: Number(id) } })
    if (!existing) throw Object.assign(new Error('Rota não encontrada.'), { status: 404 })

    if (driverId !== undefined && driverId !== null) {
      await assertValidDriver(tx, driverId)
    }

    if (status !== undefined && !VALID_STATUS.has(status)) {
      throw Object.assign(new Error(`Status inválido: ${status}.`), { status: 400 })
    }

    const data = {}
    if (name !== undefined)         data.name         = name.trim()
    if (region !== undefined)       data.region       = (region || '').trim()
    if (driverId !== undefined)     data.driverId     = driverId ?? null
    if (scheduledFor !== undefined) data.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
    if (notes !== undefined)        data.notes        = (notes || '').trim()
    if (status !== undefined)       data.status       = status

    return tx.route.update({ where: { id: Number(id) }, data, include: ROUTE_INCLUDE })
  })
}

/* ── Delete ── */
const deleteRoute = async (id) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.route.findUnique({
      where: { id: Number(id) },
      include: { orders: { select: { id: true } } },
    })
    if (!existing) throw Object.assign(new Error('Rota não encontrada.'), { status: 404 })

    if (existing.orders.length > 0) {
      // Desvincula pedidos antes de apagar
      await tx.order.updateMany({
        where: { routeId: Number(id) },
        data:  { routeId: null },
      })
    }

    await tx.route.delete({ where: { id: Number(id) } })
    return { id: Number(id) }
  })
}

/* ── Assign / Unassign orders ── */
const assignOrders = async (id, orderIds) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({ where: { id: Number(id) } })
    if (!route) throw Object.assign(new Error('Rota não encontrada.'), { status: 404 })

    const ids = (orderIds || []).map(Number).filter(Number.isFinite)
    if (ids.length === 0) {
      throw Object.assign(new Error('orderIds[] é obrigatório.'), { status: 400 })
    }

    // Apenas pedidos DELIVERY podem ter rota
    const orders = await tx.order.findMany({ where: { id: { in: ids } } })
    for (const o of orders) {
      if (o.deliveryType === 'PICKUP') {
        throw Object.assign(
          new Error(`Pedido #${o.id} é de retirada (PICKUP) e não pode ter rota.`),
          { status: 400 },
        )
      }
    }

    await tx.order.updateMany({
      where: { id: { in: ids } },
      data: {
        routeId:  Number(id),
        driverId: route.driverId ?? null,
        route:    route.name,
      },
    })

    return tx.route.findUnique({ where: { id: Number(id) }, include: ROUTE_INCLUDE })
  })
}

const unassignOrder = async (id, orderId) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({ where: { id: Number(id) } })
    if (!route) throw Object.assign(new Error('Rota não encontrada.'), { status: 404 })

    await tx.order.updateMany({
      where: { id: Number(orderId), routeId: Number(id) },
      data:  { routeId: null },
    })

    return tx.route.findUnique({ where: { id: Number(id) }, include: ROUTE_INCLUDE })
  })
}

/* ── Listar pedidos atribuíveis (DELIVERY, sem rota, status PENDING/CONFIRMED/SEPARATING/READY) ── */
const listAssignableOrders = () =>
  prisma.order.findMany({
    where: {
      deliveryType: 'DELIVERY',
      routeId:      null,
      status:       { in: ['PENDING', 'CONFIRMED', 'SEPARATING', 'READY'] },
    },
    select: {
      id: true, clientName: true, status: true, address: true, totalBoxes: true,
      deliveryWindowStart: true, deliveryWindowEnd: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

module.exports = {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  assignOrders,
  unassignOrder,
  listAssignableOrders,
}
