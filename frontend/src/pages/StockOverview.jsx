import { useState, useEffect, useMemo } from 'react'
import { fetchConsolidatedStock } from '../services/inventoryService'
import { ZONE_LABELS } from '../constants/zones'

const StockOverview = () => {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetchConsolidatedStock()
      .then(setStock)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return stock.filter(s => {
      if (q && !s.productName.toLowerCase().includes(q)) return false
      return true
    })
  }, [stock, search])

  const totalItems = filtered.reduce((s, f) => s + f.totalQuantity, 0)

  const toggle = (pid) =>
    setExpanded(prev => ({ ...prev, [pid]: !prev[pid] }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-secondary">A carregar estoque...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-primary m-0">Estoque Geral</h1>
          <p className="text-xs text-secondary m-0 mt-1">
            {filtered.length} produtos | {totalItems} unidades totais
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="flex-1 bg-input border border-border-input rounded px-3 py-2.5 text-sm text-primary outline-none focus:border-red transition-colors"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center">
          <p className="text-sm text-secondary m-0">Nenhum produto em estoque.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_40px] gap-2 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
            <span>Produto</span>
            <span className="text-right">Quantidade</span>
            <span className="text-right">Unidade</span>
            <span></span>
          </div>

          {filtered.map(item => (
            <div key={item.productId}>
              {/* Row */}
              <div
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_100px_40px] items-center gap-2 px-5 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors duration-[120ms] hover:bg-hover"
                onClick={() => toggle(item.productId)}
              >
                <span className="text-[0.8125rem] font-medium text-primary">{item.productName}</span>
                <span className="hidden sm:block text-[0.8125rem] font-bold text-primary text-right">{item.totalQuantity}</span>
                <span className="hidden sm:block text-xs text-secondary text-right">{item.unit}</span>
                {/* Mobile: show qty inline */}
                <span className="sm:hidden text-sm font-bold text-primary text-right">{item.totalQuantity} {item.unit}</span>
                <span className="hidden sm:flex justify-center">
                  <svg
                    className={`w-4 h-4 text-secondary transition-transform duration-200 ${expanded[item.productId] ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>

              {/* Expanded — container breakdown */}
              {expanded[item.productId] && (
                <div className="bg-hover/50 border-b border-border">
                  <div className="px-8 py-2">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-muted mb-2">Locais</p>
                    {item.containers.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-1.5 text-xs">
                        <span className="text-secondary">
                          {ZONE_LABELS[c.zone] || c.zone} — {c.label}
                        </span>
                        <span className="font-medium text-primary">{c.quantity} / {c.capacity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StockOverview
