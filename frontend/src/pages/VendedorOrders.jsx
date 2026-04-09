import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orderService'

import { STATUS_CONFIG, STATUS_FALLBACK } from '../constants/status'

const summariseItems = (items = []) => {
  if (!items.length) return '—'
  const names = items.map(i => i.product?.name ?? '?')
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

/* ── Mobile order card ── */
const OrderMobileCard = ({ order }) => {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_FALLBACK
  return (
    <div className="bg-surface border border-border rounded-md p-4 flex flex-col gap-2 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.8125rem] font-bold text-secondary">
          #{String(order.id).padStart(4, '0')}
        </span>
        <span
          className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
          style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>
      <p className="text-[0.8125rem] text-primary m-0 overflow-hidden text-ellipsis whitespace-nowrap">{order.client?.email ?? '—'}</p>
      <p className="text-[0.8rem] text-secondary m-0 overflow-hidden text-ellipsis whitespace-nowrap">{summariseItems(order.items)}</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-xs text-muted">
          {order.totalBoxes} cxs
        </span>
        <span className="text-xs text-muted">
          {new Date(order.createdAt).toLocaleDateString('pt-PT')}
        </span>
      </div>
    </div>
  )
}

const VendedorOrders = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  )

  return (
    <div className="p-6 flex flex-col gap-5">

      <div className="flex items-center justify-end gap-4 flex-wrap">
        <button
          className="bg-red border-none rounded px-5 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer whitespace-nowrap transition-colors duration-[180ms] hover:bg-red-h active:bg-red-a"
          onClick={() => navigate('/vendedor/orders/new')}
        >
          + Novo Pedido
        </button>
      </div>

      {/* Desktop table */}
      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card max-md:hidden">
        <div className="grid grid-cols-[80px_1fr_1fr_70px_130px_100px] items-center px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border gap-2 max-lg:grid-cols-[70px_1fr_70px_130px_90px]">
          <span>Pedido</span>
          <span>Cliente</span>
          <span className="max-lg:hidden">Produtos</span>
          <span className="text-right">Caixas</span>
          <span>Status</span>
          <span>Data</span>
        </div>

        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : sorted.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum pedido registado.</p>
        ) : (
          sorted.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_FALLBACK
            return (
              <div key={order.id} className="grid grid-cols-[80px_1fr_1fr_70px_130px_100px] items-center px-5 py-3.5 gap-2 border-b border-border last:border-b-0 transition-colors duration-[120ms] hover:bg-hover max-lg:grid-cols-[70px_1fr_70px_130px_90px]">
                <span className="font-mono text-[0.8125rem] font-bold text-secondary">
                  #{String(order.id).padStart(4, '0')}
                </span>
                <span className="text-[0.8125rem] text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                  {order.client?.email ?? '—'}
                </span>
                <span className="text-[0.8125rem] text-secondary overflow-hidden text-ellipsis whitespace-nowrap max-lg:hidden">
                  {summariseItems(order.items)}
                </span>
                <span className="text-sm font-semibold text-primary text-right">
                  {order.totalBoxes}
                </span>
                <span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                    style={{ color: cfg.color, borderColor: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </span>
                <span className="text-[0.8125rem] text-secondary">
                  {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Mobile cards */}
      <div className="hidden max-md:flex flex-col gap-3">
        {loading ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">A carregar...</p>
        ) : sorted.length === 0 ? (
          <p className="py-10 px-5 text-sm text-muted m-0 text-center">Nenhum pedido registado.</p>
        ) : (
          sorted.map(order => (
            <OrderMobileCard key={order.id} order={order} />
          ))
        )}
      </div>

    </div>
  )
}

export default VendedorOrders
