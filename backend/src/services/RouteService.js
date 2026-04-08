const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/* ────────────────────────────────────────
   Coordenadas do depósito SAAB (Orlando)
──────────────────────────────────────── */
const DEPOT = { lat: 28.4626, lon: -81.3305, address: '6843 Conway Rd Ste 120, Orlando, FL 32812' }

/* ── Haversine: distância em km entre dois pontos ── */
const haversine = (a, b) => {
  const R  = 6371
  const d  = (v) => (v * Math.PI) / 180
  const dLat = d(b.lat - a.lat)
  const dLon = d(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(d(a.lat)) * Math.cos(d(b.lat)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

/* ── Converte "HH:MM" para minutos desde meia-noite ── */
const toMinutes = (hhmm = '08:00') => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/* ── Velocidade média de entrega urbana (km/h) ── */
const AVG_SPEED_KMH = 40

/**
 * Ordena pedidos por janela de entrega (deliveryWindowStart).
 * Calcula distância, tempo de viagem e ETA sequencialmente.
 */
const buildRoute = (orders, startMinutes = 6 * 60) => {
  const sorted = [...orders].sort((a, b) =>
    toMinutes(a.deliveryWindowStart) - toMinutes(b.deliveryWindowStart)
  )

  const route   = []
  let   pos     = DEPOT
  let   minutes = startMinutes

  for (const order of sorted) {
    const dist       = haversine(pos, { lat: order.lat, lon: order.lon })
    const travelMin  = (dist / AVG_SPEED_KMH) * 60
    const arrivalMin = minutes + travelMin
    const waitMin    = Math.max(0, toMinutes(order.deliveryWindowStart) - arrivalMin)

    route.push({
      stopNumber:    route.length + 1,
      orderId:       order.id,
      clientEmail:   order.client?.email,
      address:       order.address,
      lat:           order.lat,
      lon:           order.lon,
      totalBoxes:    order.totalBoxes,
      status:        order.status,
      distanceKm:    Math.round(dist * 10) / 10,
      travelMinutes: Math.round(travelMin),
      waitMinutes:   Math.round(waitMin),
      etaMinutes:    Math.round(arrivalMin + waitMin),
      deliveryWindowStart: order.deliveryWindowStart,
      deliveryWindowEnd:   order.deliveryWindowEnd,
      items:         order.items,
    })

    minutes = arrivalMin + waitMin + 15
    pos     = { lat: order.lat, lon: order.lon }
  }

  return { depot: DEPOT, departureTime: '06:00', stops: route }
}

/** Formata minutos desde meia-noite em "HH:MM" */
const formatETA = (minutes) => {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Devolve a rota diária com pedidos prontos para entrega
 * (READY, IN_TRANSIT) ou pendentes de processamento (PENDING, CONFIRMED).
 */
const getDailyRoute = async () => {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'SEPARATING', 'READY', 'IN_TRANSIT'] },
      lat:    { not: null },
      lon:    { not: null },
    },
    include: {
      client: { select: { id: true, email: true } },
      items:  { include: { product: true } },
    },
  })

  if (orders.length === 0) {
    return { depot: DEPOT, departureTime: '06:00', stops: [], message: 'Sem pedidos para entrega.' }
  }

  const route = buildRoute(orders)

  // Enriquece com ETA formatada
  route.stops = route.stops.map(s => ({ ...s, eta: formatETA(s.etaMinutes) }))

  return route
}

module.exports = { getDailyRoute }
