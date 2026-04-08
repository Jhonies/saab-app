import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderById, loadOrder, deliverOrder } from '../services/orderService'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',     color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',   color: '#a0a0a0', bg: '#a0a0a025' },
  SEPARATING: { label: 'Em Separação', color: '#4a4a4a', bg: '#4a4a4a18' },
  READY:      { label: 'Pronto',       color: '#15803d', bg: '#15803d18' },
  IN_TRANSIT: { label: 'Em Trânsito',   color: '#4a4a4a', bg: '#4a4a4a18' },
  DELIVERED:  { label: 'Entregue',     color: '#15803d', bg: '#15803d18' },
  CANCELLED:  { label: 'Cancelado',    color: '#f87171', bg: '#f8717118' },
}

/* ── Icons ── */
const IconBack = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconMap = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25M5.25 3h13.5A2.25 2.25 0 0121 5.25v13.5
         A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25
         A2.25 2.25 0 015.25 3z" />
  </svg>
)

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const DriverDelivery = () => {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [order,       setOrder]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [acting,      setActing]      = useState(false)
  const [error,       setError]       = useState('')

  const load = () => {
    setLoading(true)
    fetchOrderById(id)
      .then(setOrder)
      .catch(() => setError('Pedido não encontrado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleLoad = async () => {
    setActing(true)
    setError('')
    try {
      const updated = await loadOrder(id)
      setOrder(updated)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao confirmar carga.')
    } finally {
      setActing(false)
    }
  }

  const handleDeliver = async () => {
    setActing(true)
    setError('')
    try {
      const updated = await deliverOrder(id)
      setOrder(updated)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erro ao confirmar entrega.')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="py-12 px-6 text-sm text-muted text-center">A carregar...</div>
  if (error && !order) return <div className="py-12 px-6 text-sm text-muted text-center">{error}</div>

  const cfg      = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#888', bg: '#88888818' }
  const mapsUrl  = order.lat && order.lon
    ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lon}&travelmode=driving`
    : null

  const totalWeight = order.items?.reduce((s, i) => s + (i.weightLb ?? 0), 0) ?? order.weightLb ?? 0

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[720px]">

      {/* ── Back ── */}
      <button
        className="inline-flex items-center gap-2 bg-transparent border-none p-0 text-[0.8125rem] text-secondary cursor-pointer transition-colors duration-150 w-fit hover:text-primary"
        onClick={() => navigate('/motorista/routes')}
      >
        <IconBack /> Rota do Dia
      </button>

      {/* ── Header ── */}
      <div className="bg-surface border border-border border-l-4 border-l-red rounded-[6px] px-6 py-5 flex flex-col gap-4 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <p className="text-[0.5625rem] font-bold uppercase tracking-[0.25em] text-red m-0">Entrega</p>
            <h1 className="text-[1.75rem] font-bold text-primary m-0 leading-none font-mono">#{String(order.id).padStart(4, '0')}</h1>
            <span
              className="inline-block px-2.5 py-[0.2rem] rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] w-fit"
              style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.label}
            </span>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-border-input rounded text-[0.8125rem] font-semibold text-secondary no-underline transition-colors duration-150 whitespace-nowrap hover:border-info hover:text-info"
            >
              <IconMap />
              Abrir no Google Maps
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-3 text-[0.8125rem] items-baseline">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted min-w-[64px] shrink-0">Cliente</span>
            <span className="text-primary">{order.client?.email ?? '—'}</span>
          </div>
          <div className="flex gap-3 text-[0.8125rem] items-baseline">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted min-w-[64px] shrink-0">Endereço</span>
            <span className="text-primary">{order.address || '—'}</span>
          </div>
          <div className="flex gap-3 text-[0.8125rem] items-baseline">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted min-w-[64px] shrink-0">Janela</span>
            <span className="text-primary">
              {order.deliveryWindowStart} – {order.deliveryWindowEnd}
            </span>
          </div>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted m-0">Itens a Entregar</h2>

        <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-card">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-b-0 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-primary font-medium">{item.product?.name ?? '—'}</span>
                <span className="text-xs text-secondary">{item.product?.type ?? ''}</span>
              </div>
              <div className="flex gap-5 items-center shrink-0 max-sm:gap-3">
                <span className="text-sm font-bold text-primary min-w-[48px] text-right">{item.quantity} cx</span>
                <span className="text-sm text-secondary min-w-[56px] text-right">
                  {item.weightLb > 0 ? `${item.weightLb} lbs` : '—'}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between px-5 py-3.5 bg-hover border-t border-border">
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">Total</span>
            <div className="flex gap-5 max-sm:gap-3">
              <span className="text-[0.9375rem] font-bold text-primary min-w-[48px] text-right">{order.totalBoxes} cx</span>
              <span className="text-[0.9375rem] font-bold text-primary min-w-[48px] text-right">
                {totalWeight > 0 ? `${totalWeight} lbs` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Painel de Acções ── */}
      <div className="flex flex-col gap-3">

        {error && (
          <p className="text-[0.8125rem] text-error bg-error-bg border border-red/25 rounded px-3.5 py-2.5 m-0">
            {error}
          </p>
        )}

        {order.status === 'READY' && (
          <div className="bg-surface border border-border rounded-[6px] px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Confirma que carregaste todos os itens na viatura antes de sair.
            </p>
            <button
              className="bg-red hover:bg-red-h active:bg-red-a text-on-red font-bold uppercase border-none rounded px-7 py-3 text-[0.9375rem] tracking-[0.06em] cursor-pointer w-fit transition-colors duration-[180ms] disabled:opacity-40 disabled:cursor-not-allowed max-sm:w-full max-sm:text-center"
              disabled={acting}
              onClick={handleLoad}
            >
              {acting ? 'A processar...' : 'Confirmar Carga'}
            </button>
          </div>
        )}

        {order.status === 'IN_TRANSIT' && (
          <div className="bg-surface border border-border rounded-[6px] px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Confirma a entrega ao cliente.
            </p>
            <button
              className="bg-red hover:bg-red-h active:bg-red-a text-on-red font-bold uppercase border-none rounded px-7 py-3 text-[0.9375rem] tracking-[0.06em] cursor-pointer w-fit transition-colors duration-[180ms] disabled:opacity-40 disabled:cursor-not-allowed max-sm:w-full max-sm:text-center"
              disabled={acting}
              onClick={handleDeliver}
            >
              {acting ? 'A processar...' : 'Confirmar Entrega'}
            </button>
          </div>
        )}

        {order.status === 'DELIVERED' && (
          <div className="bg-ok-bg border border-ok rounded-[6px] px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-ok text-on-red shrink-0">
                <IconCheck />
              </span>
              <div>
                <p className="text-base font-bold text-ok m-0 mb-1">Entrega Confirmada</p>
                {order.deliveredAt && (
                  <p className="text-[0.8125rem] text-secondary m-0">
                    {new Date(order.deliveredAt).toLocaleString('pt-PT', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!['READY', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) && (
          <div className="bg-surface border border-border rounded-[6px] px-6 py-5 flex flex-col gap-4">
            <p className="text-[0.8125rem] text-secondary m-0 leading-relaxed">
              Este pedido está em estado <strong>{cfg.label}</strong> — sem acções disponíveis para o motorista.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}

export default DriverDelivery
