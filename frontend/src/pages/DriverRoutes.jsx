import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDailyRoute } from '../services/routeService'
import styles from './DriverRoutes.module.css'

/* ── Icons ── */
const IconDepot = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18
         M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15
         M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75
         c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
)

const IconRefresh = ({ spinning }) => (
  <svg className={spinning ? styles.spinning : ''} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992
         m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7
         M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)

const IconNav = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25M5.25 3h13.5
         A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25
         A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z" />
  </svg>
)

const IconClock = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
  </svg>
)

const IconPin = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z
         M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5
         a7.5 7.5 0 1115 0z" />
  </svg>
)

const IconBox = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622
         a2.25 2.25 0 01-2.247-2.118L3.75 7.5
         M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5
         c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5
         c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)

const IconSign = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652
         L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685
         a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

/* ── Google Maps navigation URL ── */
const mapsUrl = (lat, lon) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`

/* ── Google Maps full route URL ── */
const buildGoogleMapsUrl = (stops, depot) => {
  const origin      = `${depot.lat},${depot.lon}`
  const destination = `${stops.at(-1).lat},${stops.at(-1).lon}`
  const waypoints   = stops.slice(0, -1).map(s => `${s.lat},${s.lon}`).join('|')
  const base = 'https://www.google.com/maps/dir/?api=1'
  return `${base}&origin=${origin}&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : '') +
    `&travelmode=driving`
}

/* ── RouteMap ── */
const RouteMap = ({ stops, depot }) => {
  if (!stops?.length) return null

  const allPoints = [depot, ...stops]
  const lats = allPoints.map(p => p.lat)
  const lons = allPoints.map(p => p.lon)
  const pad  = 0.05

  const bbox = [
    Math.min(...lons) - pad,
    Math.min(...lats) - pad,
    Math.max(...lons) + pad,
    Math.max(...lats) + pad,
  ].join(',')

  const src = `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${bbox}&layer=mapnik&marker=${depot.lat},${depot.lon}`

  return (
    <div className={styles.mapCard}>
      <div className={styles.mapHeader}>
        <p className={styles.mapLabel}>Mapa da Rota — {stops.length} paragens</p>
        <a
          href={buildGoogleMapsUrl(stops, depot)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapOpenBtn}
        >
          Abrir no Google Maps
        </a>
      </div>
      <iframe
        className={styles.mapFrame}
        src={src}
        title="Mapa da rota de entrega"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

/* ── StopCard ── */
const StopCard = ({ stop, isLast, isDelivered, onDeliver }) => {
  const products = stop.items
    ?.map(i => `${i.product?.name} (${i.quantity} cxs)`)
    .join(' · ') ?? ''

  return (
    <div className={`${styles.stop} ${isDelivered ? styles.stopDone : ''}`}>

      {/* Number column */}
      <div className={styles.stopNumber}>
        <div className={`${styles.stopBadge} ${isDelivered ? styles.done : ''}`}>
          {stop.stopNumber}
        </div>
        {!isLast && <div className={styles.stopConnector} />}
      </div>

      {/* Content */}
      <div className={styles.stopContent}>
        <div className={styles.stopHeader}>
          <div>
            <p className={styles.stopClient}>{stop.clientEmail}</p>
            <p className={styles.stopAddress}>{stop.address}</p>
          </div>
          <div className={styles.stopActions}>
            <a
              href={mapsUrl(stop.lat, stop.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.navBtn}
            >
              <IconNav />
              Navegar
            </a>
            {!isDelivered ? (
              <button className={styles.deliverBtn} onClick={onDeliver}>
                <IconSign />
                Entregar
              </button>
            ) : (
              <span className={styles.deliveredBadge}>
                <IconCheck />
                Entregue
              </span>
            )}
          </div>
        </div>

        <div className={styles.tags}>
          <span className={`${styles.tag} ${styles.window}`}>
            <IconClock />
            Janela: {stop.deliveryWindowStart} – {stop.deliveryWindowEnd}
          </span>
          <span className={`${styles.tag} ${styles.eta}`}>
            <IconClock />
            ETA: {stop.eta}
            {stop.waitMinutes > 0 && ` (+${stop.waitMinutes}min espera)`}
          </span>
          <span className={`${styles.tag} ${styles.dist}`}>
            <IconPin />
            {stop.distanceKm} km · {stop.travelMinutes} min
          </span>
          <span className={`${styles.tag} ${styles.boxes}`}>
            <IconBox />
            {stop.totalBoxes} cxs
          </span>
        </div>

        {products && <p className={styles.products}>{products}</p>}
      </div>

    </div>
  )
}

/* ── DriverRoutes ── */
const DriverRoutes = () => {
  const [route,   setRoute]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchDailyRoute()
      .then(data => { setRoute(data) })
      .catch(() => setError('Erro ao carregar a rota. Verifique a ligação ao servidor.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const totalKm   = route?.stops.reduce((s, p) => s + p.distanceKm, 0).toFixed(1) ?? 0
  const totalBoxes = route?.stops.reduce((s, p) => s + p.totalBoxes, 0) ?? 0
  const lastEta   = route?.stops.at(-1)?.eta ?? '—'

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Módulo D</p>
          <h1 className={styles.title}>Rota de Entrega — {new Date().toLocaleDateString('pt-PT')}</h1>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          <IconRefresh spinning={loading} />
          {loading ? 'A calcular…' : 'Recalcular'}
        </button>
      </div>

      {loading && <div className={styles.stateBox}>A calcular rota optimizada…</div>}

      {!loading && error && <div className={`${styles.stateBox} ${styles.error}`}>{error}</div>}

      {!loading && !error && route && (
        <>
          {/* Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Paragens</span>
              <span className={styles.summaryValue}>{route.stops.length}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Distância total</span>
              <span className={styles.summaryValue}>{totalKm} km</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total caixas</span>
              <span className={styles.summaryValue}>{totalBoxes}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Saída</span>
              <span className={styles.summaryValue}>{route.departureTime}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Última entrega (ETA)</span>
              <span className={styles.summaryValue}>{lastEta}</span>
            </div>
          </div>

          {/* Map */}
          <RouteMap stops={route.stops} depot={route.depot} />

          {/* Depot */}
          <div className={styles.depotCard}>
            <div className={styles.depotIcon}><IconDepot /></div>
            <div className={styles.depotInfo}>
              <p className={styles.depotLabel}>Ponto de Partida</p>
              <p className={styles.depotAddress}>{route.depot.address}</p>
            </div>
            <span className={styles.depotTime}>{route.departureTime}</span>
          </div>

          {/* Stops */}
          {route.stops.length === 0 ? (
            <div className={styles.stateBox}>
              {route.message ?? 'Sem paragens para hoje.'}
            </div>
          ) : (
            <div className={styles.routeList}>
              {route.stops.map((stop, i) => (
                <StopCard
                  key={stop.orderId}
                  stop={stop}
                  isLast={i === route.stops.length - 1}
                  isDelivered={stop.status === 'DELIVERED'}
                  onDeliver={() => navigate(`/motorista/delivery/${stop.orderId}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  )
}

export default DriverRoutes
