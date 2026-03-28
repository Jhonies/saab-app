const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const INCLUDE_FULL = {
  client: { select: { id: true, email: true } },
  items:  { include: { product: true, container: true } },
}

/* ── Create ── */
const createOrder = async ({ clientId, containerId, productId, quantity, weightKg = 0 }) => {
  return prisma.$transaction(async (tx) => {
    const container = await tx.container.findUnique({ where: { id: containerId } })

    if (!container) {
      throw Object.assign(new Error('Contêiner não encontrado.'), { status: 404 })
    }

    if (container.productId !== productId) {
      throw Object.assign(
        new Error('Produto não corresponde ao contêiner selecionado.'),
        { status: 400 }
      )
    }

    if (container.quantity < quantity) {
      throw Object.assign(
        new Error(`Stock insuficiente. Disponível: ${container.quantity} cxs. Solicitado: ${quantity} cxs.`),
        { status: 422 }
      )
    }

    await tx.container.update({
      where: { id: containerId },
      data:  { quantity: { decrement: quantity } },
    })

    return tx.order.create({
      data: {
        clientId,
        status:     'PENDING',
        totalBoxes: quantity,
        weightKg,
        items: {
          create: { containerId, productId, quantity, weightKg },
        },
      },
      include: INCLUDE_FULL,
    })
  })
}

/* ── List ── */
const listOrders = (filters = {}) =>
  prisma.order.findMany({
    where:   filters,
    orderBy: { createdAt: 'desc' },
    include: INCLUDE_FULL,
  })

/* ── Get by ID ── */
const getOrderById = (id) =>
  prisma.order.findUnique({
    where:   { id: Number(id) },
    include: INCLUDE_FULL,
  })

/* ── Deliver ── */
const deliverOrder = async (id, { signature, deliveredById }) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw Object.assign(
      new Error(`Pedido não pode ser entregue com status "${order.status}".`),
      { status: 422 }
    )
  }

  if (!signature || !signature.startsWith('data:image/')) {
    throw Object.assign(new Error('Assinatura inválida.'), { status: 400 })
  }

  return prisma.order.update({
    where: { id: Number(id) },
    data: {
      status:        'DELIVERED',
      signature,
      deliveredAt:   new Date(),
      deliveredById: deliveredById ? Number(deliveredById) : null,
    },
    include: INCLUDE_FULL,
  })
}

/* ── Confirm (PENDING → CONFIRMED) ── */
const confirmOrder = async (id) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status !== 'PENDING') {
    throw Object.assign(
      new Error('Só é possível confirmar pedidos com status PENDING.'),
      { status: 400 }
    )
  }

  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'CONFIRMED' },
    include: INCLUDE_FULL,
  })
}

/* ── Cancel (PENDING | CONFIRMED → CANCELLED) ── */
const cancelOrder = async (id) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status === 'DELIVERED') {
    throw Object.assign(
      new Error('Pedidos já entregues não podem ser cancelados.'),
      { status: 400 }
    )
  }

  if (order.status === 'CANCELLED') {
    throw Object.assign(new Error('Pedido já está cancelado.'), { status: 400 })
  }

  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'CANCELLED' },
    include: INCLUDE_FULL,
  })
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  deliverOrder,
  confirmOrder,
  cancelOrder,
}
