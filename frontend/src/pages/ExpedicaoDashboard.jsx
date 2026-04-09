import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orderService'

import { STATUS_LABEL, STATUS_COLOR } from '../constants/status'

const CARDS = [
  { key: 'PENDING',    label: 'Pendentes',         color: '#b45309' },
  { key: 'CONFIRMED',  label: 'A Confirmar',        color: '#888888' },
  { key: 'SEPARATING', label: 'Em Separação',       color: '#4a4a4a' },
  { key: 'READY',      label: 'Prontos para Carga', color: '#15803d' },
]

const ExpedicaoDashboard = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const map = {}
    CARDS.forEach(c => { map[c.key] = 0 })
    orders.forEach(o => {
      if (map[o.status] !== undefined) map[o.status]++
    })
    return map
  }, [orders])

  const recent = useMemo(() =>
    [...orders]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5),
    [orders]
  )

  return (
    <div className="p-6 flex flex-col gap-7 max-w-[960px]">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, color }) => (
          <div
            key={key}
            className="bg-surface border border-border rounded-[6px] px-6 py-5 shadow-card"
            style={{ borderTopWidth: '3px', borderTopColor: color }}
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary m-0 mb-2">
              {label}
            </p>
            <p className="text-[2rem] font-bold m-0 leading-none" style={{ color }}>
              {loading ? '—' : counts[key]}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-primary m-0">Actividade Recente</h2>
          <button
            className="bg-transparent border border-border-input rounded px-3.5 py-1.5 text-xs font-semibold text-secondary cursor-pointer transition-colors hover:border-muted hover:text-primary"
            onClick={() => navigate('/expedicao/orders')}
          >
            Ver Todos os Pedidos
          </button>
        </div>

        {loading ? (
          <p className="py-8 px-5 text-sm text-muted m-0">A carregar...</p>
        ) : recent.length === 0 ? (
          <p className="py-8 px-5 text-sm text-muted m-0">Sem pedidos registados.</p>
        ) : (
          <div>
            <div className="grid grid-cols-[80px_1fr_140px_130px] max-md:grid-cols-[70px_1fr_110px] px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Status</span>
              <span className="max-md:hidden">Actualizado</span>
            </div>
            {recent.map(order => (
              <div
                key={order.id}
                className="grid grid-cols-[80px_1fr_140px_130px] max-md:grid-cols-[70px_1fr_110px] items-center px-5 py-3.5 text-sm text-primary border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-hover"
                onClick={() => navigate(`/expedicao/orders/${order.id}`)}
              >
                <span className="font-bold font-mono text-[0.8125rem] text-secondary">
                  #{String(order.id).padStart(4, '0')}
                </span>
                <span className="text-[0.8125rem] text-primary overflow-hidden text-ellipsis whitespace-nowrap pr-4">
                  {order.client?.email ?? '—'}
                </span>
                <span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                    style={{
                      color:           STATUS_COLOR[order.status] ?? '#888',
                      borderColor:     STATUS_COLOR[order.status] ?? '#888',
                      backgroundColor: (STATUS_COLOR[order.status] ?? '#888') + '1a',
                    }}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </span>
                <span className="text-xs text-muted max-md:hidden">
                  {new Date(order.updatedAt).toLocaleString('pt-PT', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default ExpedicaoDashboard
