const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const INCLUDE_FULL = {
  client: { select: { id: true, email: true } },
  items:  { include: { product: true, container: true } },
}

/* ── Create ── */
const createOrder = async ({ clientId, items }) => {
  return prisma.$transaction(async (tx) => {
    const itemsToCreate = []
    let totalBoxes = 0
    let totalWeight = 0

    for (const item of items) {
      const container = await tx.container.findUnique({ where: { id: item.containerId } })

      if (!container) {
        throw Object.assign(new Error(`Contêiner #${item.containerId} não encontrado.`), { status: 404 })
      }

      if (container.productId !== item.productId) {
        throw Object.assign(
          new Error(`Produto não corresponde ao contêiner ${container.label}.`),
          { status: 400 }
        )
      }

      if (container.quantity < item.quantity) {
        throw Object.assign(
          new Error(`Stock insuficiente em ${container.label}. Disponível: ${container.quantity} cxs. Solicitado: ${item.quantity} cxs.`),
          { status: 422 }
        )
      }

      await tx.container.update({
        where: { id: item.containerId },
        data:  { quantity: { decrement: item.quantity } },
      })

      totalBoxes += item.quantity
      totalWeight += item.weightKg || 0
      itemsToCreate.push({
        containerId: item.containerId,
        productId:   item.productId,
        quantity:    item.quantity,
        weightKg:    item.weightKg || 0,
      })
    }

    return tx.order.create({
      data: {
        clientId,
        status:     'PENDING',
        totalBoxes,
        weightKg:   totalWeight,
        items:      { create: itemsToCreate },
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
const deliverOrder = async (id, { signature, deliveredById } = {}) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    throw Object.assign(
      new Error(`Pedido não pode ser entregue com status "${order.status}".`),
      { status: 422 }
    )
  }

  if (!order.signature) {
    throw Object.assign(
      new Error('Pedido não pode ser entregue sem a assinatura do cliente.'),
      { status: 400 }
    )
  }

  const data = {
    status:      'DELIVERED',
    deliveredAt: new Date(),
  }

  if (deliveredById) data.deliveredById = Number(deliveredById)
  if (signature && signature.startsWith('data:image/')) data.signature = signature

  return prisma.order.update({
    where: { id: Number(id) },
    data,
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

/* ── Separate (CONFIRMED → SEPARATING) ── */
const separateOrder = async (id, userId) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status !== 'CONFIRMED') {
    throw Object.assign(
      new Error('Só é possível iniciar separação em pedidos com status CONFIRMED.'),
      { status: 409 }
    )
  }

  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'SEPARATING', separatedById: Number(userId), separatedAt: new Date() },
    include: INCLUDE_FULL,
  })
}

/* ── Pack (SEPARATING → READY) ── */
const packOrder = async (id, userId) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status !== 'SEPARATING') {
    throw Object.assign(
      new Error('Só é possível embalar pedidos com status SEPARATING.'),
      { status: 409 }
    )
  }

  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'READY', packedById: Number(userId), packedAt: new Date() },
    include: INCLUDE_FULL,
  })
}

/* ── Load (READY → IN_TRANSIT) ── */
const loadOrder = async (id) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status !== 'READY') {
    throw Object.assign(
      new Error('Só é possível carregar pedidos com status READY.'),
      { status: 409 }
    )
  }

  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'IN_TRANSIT', loadedAt: new Date() },
    include: INCLUDE_FULL,
  })
}

/* ── Sign (cliente assina sem mudar status) ── */
const signOrder = async (id, { signature }) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status === 'CANCELLED') {
    throw Object.assign(new Error('Pedidos cancelados não podem ser assinados.'), { status: 400 })
  }

  if (!signature || !signature.startsWith('data:image/')) {
    throw Object.assign(new Error('Assinatura inválida.'), { status: 400 })
  }

  return prisma.order.update({
    where: { id: Number(id) },
    data:  { signature },
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
  separateOrder,
  packOrder,
  loadOrder,
  signOrder,
}
