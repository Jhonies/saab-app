import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDailyRoute } from '../services/routeService'

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
  <svg className={spinning ? 'animate-spin' : ''} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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

/* ── Maps URL — opens Google Maps or native app ── */
const mapsUrl = (address, lat, lon) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}&query_place_id=&center=${lat},${lon}`

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
    <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted m-0">
          Mapa da Rota — {stops.length} paradas
        </p>
        <a
          href={buildGoogleMapsUrl(stops, depot)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-info no-underline border border-border-input rounded bg-input px-3 py-1 transition-colors hover:border-info hover:text-info"
        >
          Abrir no Google Maps
        </a>
      </div>
      <iframe
        className="w-full h-80 border-none block"
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
    <div className={`flex gap-0 border-b border-border last:border-b-0 transition-colors ${isDelivered ? 'opacity-55' : 'hover:bg-hover'}`}>

      {/* Number column */}
      <div className="w-14 shrink-0 flex flex-col items-center justify-start pt-[1.125rem] pb-[1.125rem] bg-hover border-r border-border gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.8125rem] font-extrabold text-on-red transition-colors ${isDelivered ? 'bg-ok' : 'bg-red'}`}>
          {stop.stopNumber}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[24px]"
            style={{
              background: 'repeating-linear-gradient(to bottom, var(--border-input) 0px, var(--border-input) 4px, transparent 4px, transparent 8px)'
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-primary m-0">{stop.clientEmail}</p>
            <p className="text-[0.8rem] text-secondary mt-0.5 m-0">{stop.address}</p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0 items-start">
            <a
              href={mapsUrl(stop.address, stop.lat, stop.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-input border border-border-input rounded px-4 py-2.5 text-[0.8rem] font-bold text-info cursor-pointer no-underline whitespace-nowrap transition-colors shrink-0 self-start hover:bg-hover hover:border-info hover:text-info [&_svg]:w-4 [&_svg]:h-4"
            >
              <IconNav />
              Abrir no Maps
            </a>
            {!isDelivered ? (
              <button
                className="inline-flex items-center gap-2 bg-input border border-ok rounded px-4 py-2.5 text-[0.8rem] font-bold text-ok cursor-pointer whitespace-nowrap transition-colors shrink-0 self-start hover:bg-hover hover:border-ok hover:text-ok [&_svg]:w-4 [&_svg]:h-4"
                onClick={onDeliver}
              >
                <IconSign />
                Entregar
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-bold text-ok py-2.5 shrink-0 self-start [&_svg]:w-4 [&_svg]:h-4">
                <IconCheck />
                Entregue
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded bg-input text-info [&_svg]:w-3 [&_svg]:h-3">
            <IconClock />
            Janela: {stop.deliveryWindowStart} – {stop.deliveryWindowEnd}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded bg-input text-warn [&_svg]:w-3 [&_svg]:h-3">
            <IconClock />
            ETA: {stop.eta}
            {stop.waitMinutes > 0 && ` (+${stop.waitMinutes}min espera)`}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded bg-input text-ok [&_svg]:w-3 [&_svg]:h-3">
            <IconPin />
            {stop.distanceKm} km · {stop.travelMinutes} min
          </span>
          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded bg-input text-error [&_svg]:w-3 [&_svg]:h-3">
            <IconBox />
            {stop.totalBoxes} cxs
          </span>
        </div>

        {products && <p className="text-xs text-muted m-0">{products}</p>}
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
    <div className="p-6 flex flex-col gap-6">

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-primary m-0">Rota de Entrega — {new Date().toLocaleDateString('pt-PT')}</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-transparent border border-border-input rounded px-4 py-2.5 text-[0.8125rem] font-semibold text-secondary cursor-pointer transition-colors hover:border-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4"
          onClick={load}
          disabled={loading}
        >
          <IconRefresh spinning={loading} />
          {loading ? 'A calcular…' : 'Recalcular'}
        </button>
      </div>

      {loading && (
        <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-muted text-sm">
          A calcular rota optimizada…
        </div>
      )}

      {!loading && error && (
        <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-error text-sm">
          {error}
        </div>
      )}

      {!loading && !error && route && (
        <>
          {/* Summary */}
          <div className="flex flex-wrap gap-4 bg-surface border border-border rounded-md px-5 py-4 shadow-card">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Paradas</span>
              <span className="text-base font-bold text-primary">{route.stops.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Distância total</span>
              <span className="text-base font-bold text-primary">{totalKm} km</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Total caixas</span>
              <span className="text-base font-bold text-primary">{totalBoxes}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Saída</span>
              <span className="text-base font-bold text-primary">{route.departureTime}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">Última entrega (ETA)</span>
              <span className="text-base font-bold text-primary">{lastEta}</span>
            </div>
          </div>

          {/* Map */}
          <RouteMap stops={route.stops} depot={route.depot} />

          {/* Depot */}
          <div className="flex items-center gap-4 bg-surface border border-border border-l-4 border-l-info rounded-md px-5 py-3.5 shadow-card">
            <div className="w-9 h-9 rounded-full bg-input border-2 border-border-input flex items-center justify-center shrink-0 text-info [&_svg]:w-4 [&_svg]:h-4">
              <IconDepot />
            </div>
            <div className="flex-1">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-info m-0 mb-0.5">Ponto de Partida</p>
              <p className="text-sm text-primary m-0">{route.depot.address}</p>
            </div>
            <span className="text-[0.8125rem] font-bold text-info whitespace-nowrap">{route.departureTime}</span>
          </div>

          {/* Stops */}
          {route.stops.length === 0 ? (
            <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-muted text-sm">
              {route.message ?? 'Sem paradas para hoje.'}
            </div>
          ) : (
            <div className="flex flex-col bg-surface border border-border rounded-md overflow-hidden shadow-card">
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
