const prisma = require('../lib/prisma')

const ROUTE_INCLUDE = {
  driver: { select: { id: true, name: true, email: true } },
  orders: {
    select: {
      id: true, clientName: true, status: true, address: true, lat: true, lon: true,
      totalBoxes: true, deliveryWindowStart: true, deliveryWindowEnd: true,
      deliveryType: true, stopOrder: true, stopNotes: true,
    },
    orderBy: [{ stopOrder: 'asc' }, { id: 'asc' }],
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

/* ── Listar rotas atribuídas a um motorista (para a tela "Rotas de hoje").
 *  Inclui apenas rotas em curso: DRAFT, READY, IN_TRANSIT.
 *  Não filtra por scheduledFor para evitar fuso/timezone — o motorista vê
 *  todas as rotas ativas atribuídas a si.
 */
const listRoutesByDriver = async (driverId) => {
  return prisma.route.findMany({
    where: {
      driverId: Number(driverId),
      status:   { in: ['DRAFT', 'READY', 'IN_TRANSIT'] },
    },
    include: ROUTE_INCLUDE,
    orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
  })
}

/* ── Get by ID ── */
const getRoute = (id) =>
  prisma.route.findUnique({ where: { id: Number(id) }, include: ROUTE_INCLUDE })

/* ── Create ── */
const createRoute = async ({ name, region, truck, driverId, scheduledFor, notes, createdById }) => {
  return prisma.$transaction(async (tx) => {
    if (driverId != null) await assertValidDriver(tx, driverId)
    return tx.route.create({
      data: {
        name:         name.trim(),
        region:       (region || '').trim(),
        truck:        (truck  || '').trim(),
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
const updateRoute = async (id, { name, region, truck, driverId, scheduledFor, notes, status }) => {
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
    if (truck !== undefined)        data.truck        = (truck  || '').trim()
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

/* ── Assign / Unassign orders ──
 * Atribui pedidos a uma rota, preservando a ordem manual (stopOrder = max + N na ordem do array).
 */
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

    // Posição inicial = maior stopOrder já existente na rota
    const lastStop = await tx.order.aggregate({
      where: { routeId: Number(id) },
      _max:  { stopOrder: true },
    })
    let nextOrder = (lastStop._max.stopOrder ?? 0) + 1

    // Atualizar cada pedido individualmente para preservar a ordem do array
    for (const orderId of ids) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          routeId:   Number(id),
          driverId:  route.driverId ?? null,
          route:     route.name,
          stopOrder: nextOrder++,
        },
      })
    }

    return tx.route.findUnique({ where: { id: Number(id) }, include: ROUTE_INCLUDE })
  })
}

/* ── Atualizar observação de uma parada (Order.stopNotes) ── */
const updateStopNotes = async (routeId, orderId, notes) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: Number(orderId) } })
    if (!order) throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
    if (order.routeId !== Number(routeId)) {
      throw Object.assign(new Error('Pedido não pertence a esta rota.'), { status: 400 })
    }

    await tx.order.update({
      where: { id: Number(orderId) },
      data:  { stopNotes: (notes ?? '').toString() },
    })

    return tx.route.findUnique({ where: { id: Number(routeId) }, include: ROUTE_INCLUDE })
  })
}

/* ── Reorder stops ──
 * Define stopOrder dos pedidos da rota na ordem do array recebido.
 * Apenas pedidos já pertencentes à rota podem ser reordenados.
 */
const reorderStops = async (id, orderIds) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({
      where:   { id: Number(id) },
      include: { orders: { select: { id: true } } },
    })
    if (!route) throw Object.assign(new Error('Rota não encontrada.'), { status: 404 })

    const ids = (orderIds || []).map(Number).filter(Number.isFinite)
    const routeOrderIds = new Set(route.orders.map(o => o.id))

    if (ids.length !== route.orders.length || ids.some(oid => !routeOrderIds.has(oid))) {
      throw Object.assign(
        new Error('orderIds[] deve conter exatamente os mesmos pedidos da rota.'),
        { status: 400 },
      )
    }

    for (let i = 0; i < ids.length; i += 1) {
      await tx.order.update({
        where: { id: ids[i] },
        data:  { stopOrder: i + 1 },
      })
    }

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
  listRoutesByDriver,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  assignOrders,
  reorderStops,
  updateStopNotes,
  unassignOrder,
  listAssignableOrders,
}
