const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/* ────────────────────────────────────────
   Coordenadas do depósito SAAB (Orlando)
──────────────────────────────────────── */
const DEPOT = { lat: 28.5383, lon: -81.3792, address: 'Depósito SAAB — Orlando, FL' }

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
 * Nearest-Neighbour com penalidade de janela de entrega.
 *
 * Pontuação de cada candidato a partir de `currentPos` e `currentMinutes`:
 *   score = travelMin + windowPenalty
 *   windowPenalty:
 *     - Se chegar antes da janela → espera até abertura
 *     - Se chegar depois do fecho → penalidade alta (500 min)
 */
const buildRoute = (orders, startMinutes = 6 * 60) => {
  const unvisited = [...orders]
  const route     = []
  let   pos       = DEPOT
  let   minutes   = startMinutes // hora de saída padrão: 06:00

  while (unvisited.length > 0) {
    let bestIdx   = -1
    let bestScore = Infinity

    unvisited.forEach((order, i) => {
      const dist      = haversine(pos, { lat: order.lat, lon: order.lon })
      const travelMin = (dist / AVG_SPEED_KMH) * 60
      const arrivalMin = minutes + travelMin

      const windowStart = toMinutes(order.deliveryWindowStart)
      const windowEnd   = toMinutes(order.deliveryWindowEnd)

      let penalty = 0
      if (arrivalMin < windowStart) {
        penalty = windowStart - arrivalMin   // espera
      } else if (arrivalMin > windowEnd) {
        penalty = 500                        // fora da janela — penalidade alta
      }

      const score = travelMin + penalty
      if (score < bestScore) { bestScore = score; bestIdx = i }
    })

    const chosen     = unvisited.splice(bestIdx, 1)[0]
    const dist       = haversine(pos, { lat: chosen.lat, lon: chosen.lon })
    const travelMin  = (dist / AVG_SPEED_KMH) * 60
    const arrivalMin = minutes + travelMin
    const waitMin    = Math.max(0, toMinutes(chosen.deliveryWindowStart) - arrivalMin)

    route.push({
      stopNumber:    route.length + 1,
      orderId:       chosen.id,
      clientEmail:   chosen.client?.email,
      address:       chosen.address,
      lat:           chosen.lat,
      lon:           chosen.lon,
      totalBoxes:    chosen.totalBoxes,
      distanceKm:    Math.round(dist * 10) / 10,
      travelMinutes: Math.round(travelMin),
      waitMinutes:   Math.round(waitMin),
      etaMinutes:    Math.round(arrivalMin + waitMin),
      deliveryWindowStart: chosen.deliveryWindowStart,
      deliveryWindowEnd:   chosen.deliveryWindowEnd,
      items:         chosen.items,
    })

    minutes = arrivalMin + waitMin + 15 // +15 min de serviço por paragem
    pos     = { lat: chosen.lat, lon: chosen.lon }
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
 * Devolve a rota diária optimizada com pedidos PENDING do dia.
 */
const getDailyRoute = async () => {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: {
      status:    { in: ['PENDING', 'CONFIRMED'] },
      createdAt: { gte: startOfDay },
      lat:       { not: null },
      lon:       { not: null },
    },
    include: {
      client: { select: { id: true, email: true } },
      items:  { include: { product: true } },
    },
  })

  if (orders.length === 0) {
    return { depot: DEPOT, departureTime: '06:00', stops: [], message: 'Sem pedidos PENDING para hoje.' }
  }

  const route = buildRoute(orders)

  // Enriquece com ETA formatada
  route.stops = route.stops.map(s => ({ ...s, eta: formatETA(s.etaMinutes) }))

  return route
}

module.exports = { getDailyRoute }
