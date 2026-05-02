import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyRoutes } from '../services/routeService'

/* ── Icons ── */
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

const IconChevron = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const STATUS_LABEL = {
  DRAFT:      'Em preparo',
  READY:      'Pronta',
  IN_TRANSIT: 'Em trânsito',
  COMPLETED:  'Concluída',
}

const STATUS_BADGE = {
  DRAFT:      'bg-warn-bg text-warn',
  READY:      'bg-ok-bg text-ok',
  IN_TRANSIT: 'bg-info-bg text-info',
  COMPLETED:  'bg-hover text-secondary',
}

/* ── Maps URL — abre Google Maps com rota completa partindo da localização do motorista ── */
const buildRouteMapsUrl = (stops) => {
  if (!stops?.length) return '#'
  const destination = `${stops.at(-1).lat ?? ''},${stops.at(-1).lon ?? ''}`
  const waypoints   = stops.slice(0, -1)
    .filter(s => s.lat != null && s.lon != null)
    .map(s => `${s.lat},${s.lon}`)
    .join('|')
  const base = 'https://www.google.com/maps/dir/?api=1'
  return `${base}&origin=My+Location&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : '') +
    `&travelmode=driving`
}

const stopMapsUrl = (address, lat, lon) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || `${lat},${lon}`)}`

/* ── Card de uma rota com dropdown de paradas ── */
const RouteCard = ({ route, onDeliver }) => {
  const [open, setOpen] = useState(true)

  const totalBoxes = route.orders.reduce((s, o) => s + (o.totalBoxes || 0), 0)
  const stopsHref  = buildRouteMapsUrl(route.orders)

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
      {/* Header clicável */}
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-transparent border-none text-left cursor-pointer hover:bg-hover transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-primary m-0 uppercase">
              {route.name}
              {route.region && ` - ${route.region}`}
              {route.scheduledFor && ` - ${new Date(route.scheduledFor).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}`}
            </h3>
            <span className={`inline-flex items-center text-[0.625rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_BADGE[route.status] ?? 'bg-hover text-secondary'}`}>
              {STATUS_LABEL[route.status] ?? route.status}
            </span>
          </div>
          <p className="text-xs text-secondary m-0 uppercase tracking-wide">
            TRUCK: <strong className="text-primary">{route.truck || '—'}</strong>
          </p>
          <p className="text-xs text-secondary m-0 uppercase tracking-wide">
            DRIVER: <strong className="text-primary">{route.driver?.name || '—'}</strong>
            {route.notes && <span className="text-muted normal-case tracking-normal"> ({route.notes})</span>}
          </p>
          <p className="text-xs text-muted m-0">
            {route.orders.length} parada(s) · {totalBoxes} cxs
          </p>
        </div>
        <span className="text-muted shrink-0"><IconChevron open={open} /></span>
      </button>

      {open && (
        <>
          {route.orders.length === 0 ? (
            <p className="text-center py-6 text-muted text-sm border-t border-border">Sem paradas atribuídas a esta rota.</p>
          ) : (
            <>
              <div className="border-t border-border">
                {route.orders.map((stop, i) => {
                  const isDelivered = stop.status === 'DELIVERED'
                  const isLast      = i === route.orders.length - 1
                  return (
                    <div
                      key={stop.id}
                      className={`flex gap-0 ${!isLast ? 'border-b border-border' : ''} transition-colors ${isDelivered ? 'opacity-55' : 'hover:bg-hover'}`}
                    >
                      <div className="w-12 shrink-0 flex flex-col items-center justify-start pt-4 pb-4 bg-hover border-r border-border">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-on-red ${isDelivered ? 'bg-ok' : 'bg-red'}`}>
                          {i + 1}
                        </div>
                      </div>

                      <div className="flex-1 px-4 py-3 flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-primary m-0 truncate">{stop.clientName || `Pedido #${stop.id}`}</p>
                            <p className="text-[0.8rem] text-secondary mt-0.5 m-0">{stop.address || '—'}</p>
                            {stop.stopNotes && (
                              <p className="text-[0.8rem] text-warn mt-1 m-0 italic">
                                Obs.: {stop.stopNotes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap shrink-0 items-start">
                            <a
                              href={stopMapsUrl(stop.address, stop.lat, stop.lon)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-input border border-border-input rounded px-3 py-1.5 text-xs font-bold text-info cursor-pointer no-underline whitespace-nowrap transition-colors hover:bg-hover hover:border-info hover:text-info [&_svg]:w-3.5 [&_svg]:h-3.5"
                            >
                              <IconNav /> Maps
                            </a>
                            {!isDelivered && (
                              <button
                                className="inline-flex items-center gap-1.5 bg-input border border-ok rounded px-3 py-1.5 text-xs font-bold text-ok cursor-pointer whitespace-nowrap transition-colors hover:bg-hover [&_svg]:w-3.5 [&_svg]:h-3.5"
                                onClick={() => onDeliver(stop.id)}
                              >
                                <IconSign /> Entregar
                              </button>
                            )}
                            {isDelivered && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-ok py-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5">
                                <IconCheck /> Entregue
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded bg-input text-secondary [&_svg]:w-3 [&_svg]:h-3">
                            <IconBox /> {stop.totalBoxes || 0} cxs
                          </span>
                          <span className="text-[0.6875rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-input text-secondary">
                            {stop.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-5 py-3 border-t border-border">
                <a
                  href={stopsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-info no-underline border border-border-input rounded bg-input px-3 py-2 transition-colors hover:border-info hover:text-info [&_svg]:w-3.5 [&_svg]:h-3.5"
                >
                  <IconNav /> Abrir rota completa no Google Maps
                </a>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ── DriverRoutes ── */
const DriverRoutes = () => {
  const [routes,  setRoutes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchMyRoutes()
      .then(data => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => setError('Erro ao carregar rotas. Verifique a ligação ao servidor.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 flex flex-col gap-6">

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-primary m-0">Rotas de hoje</h1>
          <p className="text-xs text-secondary m-0">{new Date().toLocaleDateString('pt-PT')}</p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-transparent border border-border-input rounded px-4 py-2.5 text-[0.8125rem] font-semibold text-secondary cursor-pointer transition-colors hover:border-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4"
          onClick={load}
          disabled={loading}
        >
          <IconRefresh spinning={loading} />
          {loading ? 'A carregar…' : 'Atualizar'}
        </button>
      </div>

      {loading && (
        <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-muted text-sm">
          A carregar rotas…
        </div>
      )}

      {!loading && error && (
        <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-error text-sm">
          {error}
        </div>
      )}

      {!loading && !error && routes.length === 0 && (
        <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-muted text-sm">
          Sem rotas atribuídas no momento.
        </div>
      )}

      {!loading && !error && routes.length > 0 && (
        <div className="flex flex-col gap-4">
          {routes.map(r => (
            <RouteCard
              key={r.id}
              route={r}
              onDeliver={(orderId) => navigate(`/motorista/delivery/${orderId}`)}
            />
          ))}
        </div>
      )}

    </div>
  )
}

export default DriverRoutes
