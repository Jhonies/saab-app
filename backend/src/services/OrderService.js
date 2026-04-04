const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const INCLUDE_FULL = {
  client: { select: { id: true, email: true } },
  items:  {
    include: {
      product:    true,
      container:  true,
      boxWeights: { orderBy: { boxNumber: 'asc' } },
    }
  },
}

/* ── Depot fallback (Orlando, FL) ── */
const DEFAULT_GEO = { address: 'Orlando, FL', lat: 28.5383, lon: -81.3792 }

/* ── Create ── */
const createOrder = async ({ clientId, items }) => {
  return prisma.$transaction(async (tx) => {
    const itemsToCreate = []
    let totalBoxes = 0

    for (const item of items) {
      // Buscar todos os containers com este produto, ordenados por label
      const containers = await tx.container.findMany({
        where: { productId: item.productId },
        orderBy: { label: 'asc' },
      })

      const totalAvailable = containers.reduce((s, c) => s + c.quantity, 0)

      if (totalAvailable < item.quantity) {
        const productName = containers[0]?.product?.name ?? `#${item.productId}`
        throw Object.assign(
          new Error(`Stock insuficiente para produto ${productName}. Disponível: ${totalAvailable} cxs. Solicitado: ${item.quantity} cxs.`),
          { status: 422 }
        )
      }

      // Distribuir caixas pelos containers na ordem
      let remaining = item.quantity
      for (const container of containers) {
        if (remaining <= 0) break
        const take = Math.min(remaining, container.quantity)
        if (take <= 0) continue

        await tx.container.update({
          where: { id: container.id },
          data:  { quantity: { decrement: take } },
        })

        itemsToCreate.push({
          containerId: container.id,
          productId:   item.productId,
          quantity:    take,
          priceType:   item.priceType || 'PER_LB',
          pricePerLb:  item.pricePerLb ?? null,
          pricePerBox: item.pricePerBox ?? null,
        })

        remaining -= take
      }

      totalBoxes += item.quantity
    }

    // Resolve endereço/coordenadas do cliente a partir do cadastro
    const client = await tx.user.findUnique({
      where:  { id: clientId },
      select: { address: true, lat: true, lon: true },
    })

    const address = client?.address || DEFAULT_GEO.address
    const lat     = client?.lat     ?? DEFAULT_GEO.lat
    const lon     = client?.lon     ?? DEFAULT_GEO.lon

    return tx.order.create({
      data: {
        clientId,
        status:     'PENDING',
        totalBoxes,
        address,
        lat,
        lon,
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
const deliverOrder = async (id, { deliveredById } = {}) => {
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

  const data = {
    status:      'DELIVERED',
    deliveredAt: new Date(),
  }

  if (deliveredById) data.deliveredById = Number(deliveredById)

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
const packOrder = async (id, userId, itemWeights) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  if (order.status !== 'SEPARATING') {
    throw Object.assign(
      new Error('Só é possível embalar pedidos com status SEPARATING.'),
      { status: 409 }
    )
  }

  return prisma.$transaction(async (tx) => {
    let totalWeightLb = 0

    if (Array.isArray(itemWeights)) {
      for (const iw of itemWeights) {
        // Apagar boxWeights existentes (permite re-submissão)
        await tx.boxWeight.deleteMany({ where: { orderItemId: iw.orderItemId } })

        // Criar boxWeights
        if (Array.isArray(iw.boxWeights) && iw.boxWeights.length > 0) {
          await tx.boxWeight.createMany({
            data: iw.boxWeights.map(bw => ({
              orderItemId: iw.orderItemId,
              boxNumber:   bw.boxNumber,
              weightLb:    bw.weightLb,
            })),
          })
        }

        // Calcular peso total do item
        const itemWeightLb = (iw.boxWeights || []).reduce((s, bw) => s + (bw.weightLb || 0), 0)

        await tx.orderItem.update({
          where: { id: iw.orderItemId },
          data:  { weightLb: itemWeightLb },
        })

        totalWeightLb += itemWeightLb
      }
    }

    // Somar peso dos items que não foram enviados em itemWeights (PER_BOX sem boxWeights)
    const updatedItems = await tx.orderItem.findMany({ where: { orderId: Number(id) } })
    const finalWeightLb = updatedItems.reduce((s, i) => s + i.weightLb, 0)

    return tx.order.update({
      where: { id: Number(id) },
      data:  {
        status:     'READY',
        packedById: Number(userId),
        packedAt:   new Date(),
        weightLb:   finalWeightLb,
      },
      include: INCLUDE_FULL,
    })
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
}
