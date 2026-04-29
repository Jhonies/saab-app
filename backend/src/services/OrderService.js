const prisma = require('../lib/prisma')

const INCLUDE_FULL = {
  client: { select: { id: true, email: true } },
  driver: { select: { id: true, name: true, email: true } },
  items:  {
    include: {
      product:    true,
      container:  true,
      boxWeights: { orderBy: { boxNumber: 'asc' } },
    }
  },
}

/* ── Depot fallback (Orlando, FL) ── */
const DEFAULT_GEO = { address: '6843 Conway Rd Ste 120, Orlando, FL 32812', lat: 28.4626, lon: -81.3305 }

/* ── Status que já consumiram stockGeneral (READY em diante, exceto CANCELLED) ── */
const STOCK_DEDUCTED_STATUSES = new Set(['READY', 'IN_TRANSIT', 'DELIVERED'])

/* ── Staleness guard — rejects updates whose timestamp predates the last status change ── */
const assertNotStale = (order, clientTimestamp) => {
  if (!clientTimestamp || !order.lastStatusAt) return
  const clientDate = new Date(clientTimestamp)
  if (clientDate < order.lastStatusAt) {
    throw Object.assign(
      new Error('Atualização rejeitada: dados desatualizados. Recarregue o pedido e tente novamente.'),
      { status: 409 }
    )
  }
}

/* ── Validar driver: tem que existir e ter role MOTORISTA ── */
const assertValidDriver = async (tx, driverId) => {
  if (driverId == null) return
  const driver = await tx.user.findUnique({ where: { id: Number(driverId) } })
  if (!driver) {
    throw Object.assign(new Error('Motorista não encontrado.'), { status: 404 })
  }
  if (driver.role !== 'MOTORISTA') {
    throw Object.assign(new Error('Utilizador atribuído não tem role MOTORISTA.'), { status: 400 })
  }
}

/* ── Create ──
 * Validação de stock: agrega quantidade pedida por productId e compara com Product.stockGeneral.
 * Não desconta stockGeneral nem Container.quantity na criação — desconto acontece em packOrder (READY).
 * Containers são apenas referência inicial (primeiro container do produto); expedição faz baixa manual depois.
 */
const createOrder = async ({ clientId, clientName, address: inputAddress, deliveryType, route, driverId, items, updatedById }) => {
  return prisma.$transaction(async (tx) => {
    const isPickup = deliveryType === 'PICKUP'

    if (!isPickup) {
      await assertValidDriver(tx, driverId)
    }

    /* Agregar quantidade total por produto (caso o pedido tenha o mesmo produto duas vezes) */
    const qtyByProduct = new Map()
    for (const it of items) {
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + it.quantity)
    }

    /* Validar stockGeneral por produto */
    const productIds = [...qtyByProduct.keys()]
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stockGeneral: true },
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    for (const [productId, requested] of qtyByProduct.entries()) {
      const product = productMap.get(productId)
      if (!product) {
        throw Object.assign(new Error(`Produto #${productId} não encontrado.`), { status: 404 })
      }
      if (product.stockGeneral < requested) {
        throw Object.assign(
          new Error(`Stock insuficiente para ${product.name}. Disponível: ${product.stockGeneral} cxs. Solicitado: ${requested} cxs.`),
          { status: 422 }
        )
      }
    }

    /* Resolver container de referência (primeiro container do produto, se existir) */
    const itemsToCreate = []
    let totalBoxes = 0

    for (const item of items) {
      const refContainer = await tx.container.findFirst({
        where:   { productId: item.productId },
        orderBy: { label: 'asc' },
      })

      if (!refContainer) {
        throw Object.assign(
          new Error(`Produto #${item.productId} não tem container associado.`),
          { status: 422 }
        )
      }

      itemsToCreate.push({
        containerId: refContainer.id,
        productId:   item.productId,
        quantity:    item.quantity,
        priceType:   item.priceType || 'PER_LB',
        pricePerLb:  item.pricePerLb ?? null,
        pricePerBox: item.pricePerBox ?? null,
      })

      totalBoxes += item.quantity
    }

    /* Resolver endereço (apenas se DELIVERY; PICKUP fica vazio) */
    let address = ''
    let lat = null
    let lon = null

    if (!isPickup) {
      address = DEFAULT_GEO.address
      lat = DEFAULT_GEO.lat
      lon = DEFAULT_GEO.lon

      if (inputAddress) {
        address = inputAddress
      } else if (clientId) {
        const client = await tx.user.findUnique({
          where:  { id: clientId },
          select: { address: true, lat: true, lon: true },
        })
        if (client) {
          address = client.address || address
          lat = client.lat ?? lat
          lon = client.lon ?? lon
        }
      }
    }

    return tx.order.create({
      data: {
        clientId,
        clientName,
        status:       'PENDING',
        deliveryType: isPickup ? 'PICKUP' : 'DELIVERY',
        route:        isPickup ? null : (route || null),
        driverId:     isPickup ? null : (driverId ?? null),
        totalBoxes,
        address,
        lat,
        lon,
        updatedById,
        items:        { create: itemsToCreate },
      },
      include: INCLUDE_FULL,
    })
  })
}

/* ── List (paginado) ── */
const listOrders = (filters = {}, { page = 1, limit = 50 } = {}) => {
  const take = Math.min(Math.max(1, Number(limit)), 200)
  const skip = (Math.max(1, Number(page)) - 1) * take

  return prisma.order.findMany({
    where:   filters,
    orderBy: { createdAt: 'desc' },
    include: INCLUDE_FULL,
    take,
    skip,
  })
}

/* ── Get by ID ── */
const getOrderById = (id) =>
  prisma.order.findUnique({
    where:   { id: Number(id) },
    include: INCLUDE_FULL,
  })

/* ── Deliver ──
 * DELIVERY: exige IN_TRANSIT.
 * PICKUP: aceita READY (cliente retira diretamente).
 */
const deliverOrder = async (id, { deliveredById, lastStatusAt: clientTs } = {}) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: Number(id) } })

    if (!order) {
      throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
    }

    assertNotStale(order, clientTs)

    const isPickup = order.deliveryType === 'PICKUP'
    const expected = isPickup ? 'READY' : 'IN_TRANSIT'

    if (order.status !== expected) {
      throw Object.assign(
        new Error(`Pedido ${isPickup ? 'de retirada' : ''} só pode ser entregue com status ${expected}. Status atual: "${order.status}".`),
        { status: 422 }
      )
    }

    const now = new Date()
    const data = {
      status:       'DELIVERED',
      deliveredAt:  now,
      lastStatusAt: now,
    }

    if (deliveredById) {
      data.deliveredById = Number(deliveredById)
      data.updatedById   = Number(deliveredById)
    }

    return tx.order.update({
      where: { id: Number(id) },
      data,
      include: INCLUDE_FULL,
    })
  })
}

/* ── Confirm (PENDING → CONFIRMED) ── */
const confirmOrder = async (id, userId, { lastStatusAt: clientTs } = {}) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  assertNotStale(order, clientTs)

  if (order.status !== 'PENDING') {
    throw Object.assign(
      new Error('Só é possível confirmar pedidos com status PENDING.'),
      { status: 400 }
    )
  }

  const now = new Date()
  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'CONFIRMED', lastStatusAt: now, updatedById: Number(userId) },
    include: INCLUDE_FULL,
  })
}

/* ── Cancel ──
 * Se pedido já estava em READY/IN_TRANSIT (já tinha consumido stockGeneral), devolver stock.
 * Antes de READY: nada a fazer (não houve desconto na criação).
 * Container.quantity nunca é tocado (baixa manual pela expedição).
 */
const cancelOrder = async (id, userId, { lastStatusAt: clientTs } = {}) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    })

    if (order) assertNotStale(order, clientTs)

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

    if (STOCK_DEDUCTED_STATUSES.has(order.status)) {
      const qtyByProduct = new Map()
      for (const it of order.items) {
        qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + it.quantity)
      }
      for (const [productId, qty] of qtyByProduct.entries()) {
        await tx.product.update({
          where: { id: productId },
          data:  { stockGeneral: { increment: qty } },
        })
      }
    }

    const now = new Date()
    return tx.order.update({
      where:   { id: Number(id) },
      data:    { status: 'CANCELLED', lastStatusAt: now, updatedById: Number(userId) },
      include: INCLUDE_FULL,
    })
  })
}

/* ── Separate (CONFIRMED → SEPARATING) ── */
const separateOrder = async (id, userId, { lastStatusAt: clientTs } = {}) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  assertNotStale(order, clientTs)

  if (order.status !== 'CONFIRMED') {
    throw Object.assign(
      new Error('Só é possível iniciar separação em pedidos com status CONFIRMED.'),
      { status: 409 }
    )
  }

  const now = new Date()
  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'SEPARATING', separatedById: Number(userId), separatedAt: now, lastStatusAt: now, updatedById: Number(userId) },
    include: INCLUDE_FULL,
  })
}

/* ── Pack (SEPARATING → READY) ──
 * Desconta Product.stockGeneral neste momento (baixa automática do estoque geral).
 * Container.quantity NÃO é tocado — expedição faz baixa manual posteriormente.
 */
const packOrder = async (id, userId, itemWeights, { lastStatusAt: clientTs } = {}) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    })

    if (!order) {
      throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
    }

    assertNotStale(order, clientTs)

    if (order.status !== 'SEPARATING') {
      throw Object.assign(
        new Error('Só é possível embalar pedidos com status SEPARATING.'),
        { status: 409 }
      )
    }
    let totalWeightLb = 0
    const orderItemIds = new Set(order.items.map(i => i.id))

    if (Array.isArray(itemWeights)) {
      for (const iw of itemWeights) {
        if (!orderItemIds.has(iw.orderItemId)) {
          throw Object.assign(
            new Error(`orderItemId ${iw.orderItemId} não pertence ao pedido #${id}.`),
            { status: 400 }
          )
        }

        // Apagar boxWeights existentes (permite re-submissão)
        await tx.boxWeight.deleteMany({ where: { orderItemId: iw.orderItemId } })

        // Criar boxWeights
        if (Array.isArray(iw.boxWeights) && iw.boxWeights.length > 0) {
          await tx.boxWeight.createMany({
            data: iw.boxWeights.map(bw => ({
              orderItemId: iw.orderItemId,
              boxNumber:   bw.boxNumber,
              weightLb:    bw.weightLb,
              ...(bw.expiryDate && { expiryDate: new Date(bw.expiryDate) }),
              ...(bw.batch && { batch: bw.batch }),
              updatedById: Number(userId),
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
    const finalWeightLb = updatedItems.reduce((s, i) => s + Number(i.weightLb), 0)

    // Baixa automática do estoque geral (agregado por produto)
    const qtyByProduct = new Map()
    for (const it of order.items) {
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + it.quantity)
    }
    for (const [productId, qty] of qtyByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data:  { stockGeneral: { decrement: qty } },
      })
    }

    return tx.order.update({
      where: { id: Number(id) },
      data:  {
        status:       'READY',
        packedById:   Number(userId),
        packedAt:     new Date(),
        weightLb:     finalWeightLb,
        lastStatusAt: new Date(),
        updatedById:  Number(userId),
      },
      include: INCLUDE_FULL,
    })
  })
}

/* ── Load (READY → IN_TRANSIT) ──
 * Apenas DELIVERY. Pedidos PICKUP não passam por IN_TRANSIT.
 */
const loadOrder = async (id, userId, { lastStatusAt: clientTs } = {}) => {
  const order = await prisma.order.findUnique({ where: { id: Number(id) } })

  if (!order) {
    throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
  }

  assertNotStale(order, clientTs)

  if (order.deliveryType === 'PICKUP') {
    throw Object.assign(
      new Error('Pedidos de retirada (PICKUP) não devem ser carregados — usar fluxo de entrega direta.'),
      { status: 409 }
    )
  }

  if (order.status !== 'READY') {
    throw Object.assign(
      new Error('Só é possível carregar pedidos com status READY.'),
      { status: 409 }
    )
  }

  const now = new Date()
  return prisma.order.update({
    where:   { id: Number(id) },
    data:    { status: 'IN_TRANSIT', loadedAt: now, lastStatusAt: now, updatedById: Number(userId) },
    include: INCLUDE_FULL,
  })
}

/* ── Reassign route/driver (admin) ──
 * Permite editar route e driverId. Só faz sentido para DELIVERY.
 */
const reassignRoute = async (id, { route, driverId }, userId) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: Number(id) } })
    if (!order) {
      throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 })
    }
    if (order.deliveryType === 'PICKUP') {
      throw Object.assign(
        new Error('Pedidos de retirada não têm rota nem motorista.'),
        { status: 400 }
      )
    }

    if (driverId !== undefined && driverId !== null) {
      await assertValidDriver(tx, driverId)
    }

    const data = { updatedById: Number(userId) }
    if (route !== undefined)    data.route    = route || null
    if (driverId !== undefined) data.driverId = driverId ?? null

    return tx.order.update({
      where: { id: Number(id) },
      data,
      include: INCLUDE_FULL,
    })
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
  reassignRoute,
}
