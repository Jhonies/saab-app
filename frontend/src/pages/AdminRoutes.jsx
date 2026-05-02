import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  fetchRoutes, createRoute, updateRoute, deleteRoute,
  assignOrdersToRoute, unassignOrderFromRoute, fetchAssignableOrders,
  reorderRouteStops, updateStopNotes,
} from '../services/routePlanService'
import { fetchDrivers } from '../services/userService'

/* ── Depósito SAAB (Orlando) — usado apenas para preview da rota automática ── */
const DEPOT = { lat: 28.4626, lon: -81.3305 }

/* ── Haversine simples (km) ── */
const haversineKm = (a, b) => {
  if (a?.lat == null || a?.lon == null || b?.lat == null || b?.lon == null) return Infinity
  const R   = 6371
  const rad = v => (v * Math.PI) / 180
  const dLa = rad(b.lat - a.lat)
  const dLo = rad(b.lon - a.lon)
  const h   = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

/* ── Sugere ordem por janela de entrega + nearest-neighbour quando empatam ── */
const suggestOrder = (orders) => {
  const remaining = [...orders]
  const sorted = []
  let cursor = DEPOT
  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      const wa = (a.deliveryWindowStart || '99:99')
      const wb = (b.deliveryWindowStart || '99:99')
      if (wa !== wb) return wa.localeCompare(wb)
      return haversineKm(cursor, a) - haversineKm(cursor, b)
    })
    const next = remaining.shift()
    sorted.push(next)
    if (next.lat != null && next.lon != null) cursor = next
  }
  return sorted
}

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

const NEXT_STATUS = {
  DRAFT:      'READY',
  READY:      'IN_TRANSIT',
  IN_TRANSIT: 'COMPLETED',
}

const NEXT_LABEL = {
  DRAFT:      'Marcar como Pronta',
  READY:      'Iniciar trânsito',
  IN_TRANSIT: 'Concluir',
}

const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconPlus = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const IconArrowUp = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

const IconArrowDown = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const IconWand = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.847-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
  </svg>
)

/* ── Modal: criar/editar rota ── */
const RouteFormModal = ({ route, drivers, onClose, onSaved }) => {
  const isEdit = !!route
  const [name,         setName]         = useState(route?.name ?? '')
  const [region,       setRegion]       = useState(route?.region ?? '')
  const [truck,        setTruck]        = useState(route?.truck ?? '')
  const [driverId,     setDriverId]     = useState(route?.driverId ? String(route.driverId) : '')
  const [scheduledFor, setScheduledFor] = useState(route?.scheduledFor ? route.scheduledFor.slice(0, 10) : '')
  const [notes,        setNotes]        = useState(route?.notes ?? '')
  const [saving,       setSaving]       = useState(false)
  const [err,          setErr]          = useState('')

  const handleSave = async () => {
    if (!name.trim())  { setErr('Nome é obrigatório.'); return }
    if (!truck.trim()) { setErr('Truck é obrigatório.'); return }
    setSaving(true)
    setErr('')
    try {
      const data = {
        name:         name.trim(),
        region:       region.trim() || null,
        truck:        truck.trim(),
        driverId:     driverId ? Number(driverId) : null,
        scheduledFor: scheduledFor || null,
        notes:        notes.trim() || null,
      }
      const saved = isEdit
        ? await updateRoute(route.id, data)
        : await createRoute(data)
      onSaved(saved)
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-[480px] flex flex-col overflow-hidden shadow-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[0.9rem] font-bold text-primary m-0">{isEdit ? `Editar Rota #${route.id}` : 'Nova Rota'}</h2>
          <button className="bg-transparent border-none text-muted cursor-pointer p-1 hover:text-primary" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Nome</label>
            <input
              type="text"
              className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2.5 px-3.5 placeholder:text-muted focus:border-red focus:ring-2 focus:ring-red/20"
              placeholder="ex: Orlando 2 — segunda-feira"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Região</label>
            <input
              type="text"
              className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2.5 px-3.5 placeholder:text-muted focus:border-red focus:ring-2 focus:ring-red/20"
              placeholder="ex: Central FL, Miami-Jax"
              value={region}
              onChange={e => setRegion(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Truck *</label>
            <input
              type="text"
              required
              className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2.5 px-3.5 placeholder:text-muted focus:border-red focus:ring-2 focus:ring-red/20"
              placeholder="ex: NEW ISUZU"
              value={truck}
              onChange={e => setTruck(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 [&>*]:flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Motorista</label>
              <select
                className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2.5 px-3.5 focus:border-red focus:ring-2 focus:ring-red/20"
                value={driverId}
                onChange={e => setDriverId(e.target.value)}
                disabled={saving}
              >
                <option value="">— Sem motorista —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name?.trim() || d.email}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Data prevista</label>
              <input
                type="date"
                className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2.5 px-3.5 focus:border-red focus:ring-2 focus:ring-red/20"
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">Observações</label>
            <textarea
              className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2.5 px-3.5 placeholder:text-muted focus:border-red focus:ring-2 focus:ring-red/20 resize-none"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={saving}
            />
          </div>

          {err && <p className="text-[0.8125rem] text-error bg-error-bg border border-[rgba(139,0,0,0.25)] rounded px-3.5 py-2.5 m-0">{err}</p>}
        </div>

        <div className="flex gap-2 justify-end px-5 py-4 border-t border-border">
          <button className="bg-transparent border border-border-input rounded px-4 py-2 text-[0.8125rem] font-semibold text-secondary cursor-pointer hover:text-primary disabled:opacity-40" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="bg-red border-none rounded px-4 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer hover:bg-red-h disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar…' : isEdit ? 'Guardar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal: atribuir pedidos ── */
const AssignOrdersModal = ({ route, onClose, onSaved }) => {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [filter,   setFilter]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  useEffect(() => {
    fetchAssignableOrders()
      .then(setOrders)
      .catch(() => setErr('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(o =>
      o.clientName?.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    )
  }, [orders, filter])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) return
    setSaving(true)
    setErr('')
    try {
      const updated = await assignOrdersToRoute(route.id, Array.from(selected))
      onSaved(updated)
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Erro ao atribuir pedidos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-[640px] max-h-[85svh] flex flex-col overflow-hidden shadow-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[0.9rem] font-bold text-primary m-0">Atribuir pedidos — {route.name}</h2>
            <p className="text-xs text-muted mt-0.5 m-0">Apenas pedidos DELIVERY ainda sem rota</p>
          </div>
          <button className="bg-transparent border-none text-muted cursor-pointer p-1 hover:text-primary" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border">
          <input
            type="text"
            className="bg-input border border-border-input rounded text-sm text-primary outline-none w-full py-2 px-3 placeholder:text-muted focus:border-red focus:ring-2 focus:ring-red/20"
            placeholder="Pesquisar por cliente, endereço, #ID..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="text-center py-8 text-muted text-sm">A carregar...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-8 text-muted text-sm">
              {orders.length === 0 ? 'Nenhum pedido disponível para atribuir.' : 'Nenhum resultado para o filtro.'}
            </p>
          )}
          {!loading && filtered.map(o => {
            const isSelected = selected.has(o.id)
            return (
              <label
                key={o.id}
                className={`flex items-start gap-3 px-5 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors ${isSelected ? 'bg-red/10' : 'hover:bg-hover'}`}
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-red"
                  checked={isSelected}
                  onChange={() => toggle(o.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-secondary">#{o.id}</span>
                    <span className="text-sm font-semibold text-primary">{o.clientName || '—'}</span>
                    <span className="text-[0.625rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-hover text-secondary">{o.status}</span>
                  </div>
                  <p className="text-xs text-muted m-0 mt-0.5 truncate">{o.address || '—'}</p>
                  <p className="text-xs text-secondary m-0 mt-0.5">
                    {o.totalBoxes} cxs · Janela {o.deliveryWindowStart}–{o.deliveryWindowEnd}
                  </p>
                </div>
              </label>
            )
          })}
        </div>

        {err && <p className="text-[0.8125rem] text-error bg-error-bg border border-[rgba(139,0,0,0.25)] m-3 rounded px-3.5 py-2.5">{err}</p>}

        <div className="flex gap-2 justify-between items-center px-5 py-4 border-t border-border">
          <span className="text-xs text-muted">{selected.size} selecionado(s)</span>
          <div className="flex gap-2">
            <button className="bg-transparent border border-border-input rounded px-4 py-2 text-[0.8125rem] font-semibold text-secondary cursor-pointer hover:text-primary disabled:opacity-40" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="bg-red border-none rounded px-4 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer hover:bg-red-h disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleSave} disabled={saving || selected.size === 0}>
              {saving ? 'A atribuir…' : `Atribuir (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Modal: preview de rota automática ── */
const AutoRoutePreviewModal = ({ route, onClose, onApply }) => {
  const suggested = useMemo(() => suggestOrder(route.orders || []), [route])
  const [applying, setApplying] = useState(false)
  const [err,      setErr]      = useState('')

  const sameAsCurrent = useMemo(() => {
    const current = route.orders.map(o => o.id).join(',')
    const next    = suggested.map(o => o.id).join(',')
    return current === next
  }, [route.orders, suggested])

  const handleApply = async () => {
    setApplying(true)
    setErr('')
    try {
      await onApply(suggested.map(o => o.id))
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Erro ao aplicar ordem.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={e => e.target === e.currentTarget && !applying && onClose()}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-[560px] max-h-[85svh] flex flex-col overflow-hidden shadow-elevated">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[0.9rem] font-bold text-primary m-0">Melhor rota automática — {route.name}</h2>
            <p className="text-xs text-muted mt-0.5 m-0">
              Sugestão por janela de entrega + proximidade. Apenas visualização — não substitui a ordem oficial até aplicar.
            </p>
          </div>
          <button className="bg-transparent border-none text-muted cursor-pointer p-1 hover:text-primary" onClick={onClose} disabled={applying}>
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {suggested.length === 0 && <p className="text-center py-8 text-muted text-sm">Sem paradas para sugerir.</p>}
          {suggested.map((o, i) => (
            <div key={o.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
              <span className="w-7 h-7 rounded-full bg-input border border-border-input flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-secondary">#{o.id}</span>
                  <span className="text-sm text-primary">{o.clientName || '—'}</span>
                </div>
                <p className="text-xs text-muted m-0 mt-0.5 truncate">{o.address || '—'}</p>
                {o.deliveryWindowStart && (
                  <p className="text-[0.6875rem] text-secondary m-0 mt-0.5">Janela {o.deliveryWindowStart}–{o.deliveryWindowEnd}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {err && <p className="text-[0.8125rem] text-error bg-error-bg border border-[rgba(139,0,0,0.25)] m-3 rounded px-3.5 py-2.5">{err}</p>}

        <div className="flex gap-2 justify-between items-center px-5 py-4 border-t border-border">
          <span className="text-xs text-muted">{sameAsCurrent ? 'Já está nesta ordem.' : 'Ordem diferente da atual.'}</span>
          <div className="flex gap-2">
            <button className="bg-transparent border border-border-input rounded px-4 py-2 text-[0.8125rem] font-semibold text-secondary cursor-pointer hover:text-primary disabled:opacity-40" onClick={onClose} disabled={applying}>
              Fechar
            </button>
            <button
              className="bg-red border-none rounded px-4 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer hover:bg-red-h disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleApply}
              disabled={applying || sameAsCurrent || suggested.length === 0}
            >
              {applying ? 'A aplicar…' : 'Aplicar ordem sugerida'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Linha de parada (com edição inline de observação) ── */
const StopRow = ({ order, index, total, onUnassign, onMove, onSaveNotes, routeId }) => {
  const [notes,   setNotes]   = useState(order.stopNotes ?? '')
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  // Mantém o estado local sincronizado com mudanças vindas do servidor (ex: optimistic UI revert).
  useEffect(() => { setNotes(order.stopNotes ?? '') }, [order.stopNotes])

  const handleSave = async () => {
    if ((order.stopNotes ?? '') === notes.trim()) { setEditing(false); return }
    setSaving(true)
    try {
      await onSaveNotes(routeId, order.id, notes.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNotes(order.stopNotes ?? '')
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1.5 bg-hover border border-border rounded px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="w-6 h-6 rounded-full bg-input border border-border-input flex items-center justify-center text-[0.6875rem] font-bold text-primary shrink-0">{index + 1}</span>
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <span className="font-mono text-xs font-bold text-secondary">#{order.id}</span>
          <span className="text-sm text-primary truncate">{order.clientName || '—'}</span>
          <span className="text-[0.625rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-input text-secondary whitespace-nowrap">{order.status}</span>
          <span className="text-xs text-muted">{order.totalBoxes} cxs</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="bg-transparent border border-border rounded p-1 text-muted cursor-pointer hover:text-primary hover:border-muted disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => onMove(routeId, index, index - 1)}
            disabled={index === 0}
            title="Mover para cima"
          >
            <IconArrowUp />
          </button>
          <button
            className="bg-transparent border border-border rounded p-1 text-muted cursor-pointer hover:text-primary hover:border-muted disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => onMove(routeId, index, index + 1)}
            disabled={index === total - 1}
            title="Mover para baixo"
          >
            <IconArrowDown />
          </button>
          <button
            className="bg-transparent border-none text-muted cursor-pointer p-1 hover:text-error"
            onClick={() => onUnassign(routeId, order.id)}
            title="Remover desta rota"
          >
            <IconClose />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-9">
        {!editing ? (
          <>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wide text-muted">Obs.:</span>
            <span className="text-xs text-secondary flex-1 italic truncate">
              {order.stopNotes || 'Sem observação'}
            </span>
            <button
              type="button"
              className="text-[0.6875rem] font-semibold text-info bg-transparent border-none cursor-pointer hover:underline"
              onClick={() => setEditing(true)}
            >
              {order.stopNotes ? 'Editar' : 'Adicionar'}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              className="bg-input border border-border-input rounded text-xs text-primary outline-none flex-1 py-1.5 px-2.5 placeholder:text-muted focus:border-red focus:ring-2 focus:ring-red/20"
              placeholder="ex: Recebe até 17h, Abrir 6h…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              disabled={saving}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <button
              type="button"
              className="bg-red border-none rounded px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide text-on-red cursor-pointer hover:bg-red-h disabled:opacity-40"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '…' : 'Guardar'}
            </button>
            <button
              type="button"
              className="bg-transparent border border-border-input rounded px-2.5 py-1 text-[0.6875rem] font-semibold text-secondary cursor-pointer hover:text-primary disabled:opacity-40"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Card de rota ── */
const RouteCard = ({ route, onEdit, onDelete, onAssign, onUnassign, onAdvance, onMove, onPreviewAuto, onSaveStopNotes }) => {
  const driverLabel = route.driver?.name?.trim() || route.driver?.email || '—'
  const next = NEXT_STATUS[route.status]

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3 flex-wrap">
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
            DRIVER: <strong className="text-primary">{driverLabel}</strong>
            {route.notes && <span className="text-muted normal-case tracking-normal"> ({route.notes})</span>}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap shrink-0">
          {next && (
            <button
              className="inline-flex items-center gap-1.5 bg-input border border-ok rounded px-3 py-1.5 text-xs font-bold text-ok cursor-pointer hover:bg-ok hover:text-on-red transition-colors"
              onClick={() => onAdvance(route.id, next)}
            >
              {NEXT_LABEL[route.status]}
            </button>
          )}
          <button
            className="inline-flex items-center gap-1.5 bg-transparent border border-border rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer hover:border-muted hover:text-primary transition-colors"
            onClick={() => onAssign(route)}
          >
            <IconPlus /> Atribuir pedidos
          </button>
          {route.orders?.length > 1 && (
            <button
              className="inline-flex items-center gap-1.5 bg-transparent border border-border rounded px-3 py-1.5 text-xs font-semibold text-info cursor-pointer hover:border-info transition-colors"
              onClick={() => onPreviewAuto(route)}
              title="Ver melhor rota automática (preview)"
            >
              <IconWand /> Ver melhor rota automática
            </button>
          )}
          <button
            className="bg-transparent border border-border rounded px-3 py-1.5 text-xs font-semibold text-secondary cursor-pointer hover:border-muted hover:text-primary"
            onClick={() => onEdit(route)}
          >
            Editar
          </button>
          <button
            className="bg-transparent border border-border rounded px-3 py-1.5 text-xs font-semibold text-error cursor-pointer hover:border-error hover:bg-error-bg"
            onClick={() => onDelete(route)}
          >
            Apagar
          </button>
        </div>
      </div>

      <div className="px-5 py-3">
        {(!route.orders || route.orders.length === 0) ? (
          <p className="text-xs text-muted m-0">Sem pedidos atribuídos.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.625rem] font-bold uppercase tracking-wider text-muted m-0 mb-1">
              Pedidos ({route.orders.length}) · {route.orders.reduce((s, o) => s + (o.totalBoxes || 0), 0)} cxs
            </p>
            {route.orders.map((o, i) => (
              <StopRow
                key={o.id}
                order={o}
                index={i}
                total={route.orders.length}
                routeId={route.id}
                onMove={onMove}
                onUnassign={onUnassign}
                onSaveNotes={onSaveStopNotes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Página principal ── */
const AdminRoutes = () => {
  const [routes,    setRoutes]    = useState([])
  const [drivers,   setDrivers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [editing,   setEditing]   = useState(null)   // null | route | 'new'
  const [assigning, setAssigning] = useState(null)
  const [previewAuto, setPreviewAuto] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchRoutes(), fetchDrivers().catch(() => [])])
      .then(([rs, drvs]) => { setRoutes(rs); setDrivers(drvs) })
      .catch(() => setError('Erro ao carregar rotas.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    if (statusFilter === 'ALL') return routes
    return routes.filter(r => r.status === statusFilter)
  }, [routes, statusFilter])

  const handleSaved = (saved) => {
    setRoutes(prev => {
      const idx = prev.findIndex(r => r.id === saved.id)
      if (idx === -1) return [saved, ...prev]
      const next = [...prev]
      next[idx] = saved
      return next
    })
    setEditing(null)
  }

  const handleAssigned = (updated) => {
    setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r))
    setAssigning(null)
  }

  const handleDelete = async (route) => {
    if (!window.confirm(`Apagar rota "${route.name}"?\n${route.orders?.length ? `${route.orders.length} pedido(s) ficarão sem rota.` : ''}`)) return
    try {
      await deleteRoute(route.id)
      setRoutes(prev => prev.filter(r => r.id !== route.id))
    } catch (e) {
      alert(e.response?.data?.message ?? 'Erro ao apagar rota.')
    }
  }

  const handleUnassign = async (routeId, orderId) => {
    try {
      const updated = await unassignOrderFromRoute(routeId, orderId)
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (e) {
      alert(e.response?.data?.message ?? 'Erro ao desvincular pedido.')
    }
  }

  const handleAdvance = async (routeId, status) => {
    try {
      const updated = await updateRoute(routeId, { status })
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (e) {
      alert(e.response?.data?.message ?? 'Erro ao atualizar status.')
    }
  }

  const handleMove = async (routeId, fromIdx, toIdx) => {
    const route = routes.find(r => r.id === routeId)
    if (!route || !route.orders || toIdx < 0 || toIdx >= route.orders.length) return

    const reordered = [...route.orders]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    // Optimistic UI
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, orders: reordered } : r))

    try {
      const updated = await reorderRouteStops(routeId, reordered.map(o => o.id))
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (e) {
      // Reverte em caso de erro
      setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, orders: route.orders } : r))
      alert(e.response?.data?.message ?? 'Erro ao reordenar paradas.')
    }
  }

  const handleApplyAutoOrder = async (orderIds) => {
    if (!previewAuto) return
    const updated = await reorderRouteStops(previewAuto.id, orderIds)
    setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r))
    setPreviewAuto(null)
  }

  const handleSaveStopNotes = async (routeId, orderId, notes) => {
    try {
      const updated = await updateStopNotes(routeId, orderId, notes)
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (e) {
      alert(e.response?.data?.message ?? 'Erro ao guardar observação.')
      throw e
    }
  }

  const FILTERS = [
    { key: 'ALL',        label: 'Todas',       count: routes.length },
    { key: 'DRAFT',      label: 'Em preparo',  count: routes.filter(r => r.status === 'DRAFT').length },
    { key: 'READY',      label: 'Prontas',     count: routes.filter(r => r.status === 'READY').length },
    { key: 'IN_TRANSIT', label: 'Em trânsito', count: routes.filter(r => r.status === 'IN_TRANSIT').length },
    { key: 'COMPLETED',  label: 'Concluídas',  count: routes.filter(r => r.status === 'COMPLETED').length },
  ]

  return (
    <div className="p-6 flex flex-col gap-6">

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-primary m-0">Gestão de Rotas</h1>
          <p className="text-xs text-secondary m-0">
            Crie rotas, agrupe pedidos por região e atribua motoristas.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-red border-none rounded px-4 py-2.5 text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-on-red cursor-pointer hover:bg-red-h transition-colors"
          onClick={() => setEditing('new')}
        >
          <IconPlus /> Nova Rota
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`border rounded-full px-3.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap transition-colors ${
              statusFilter === f.key
                ? 'bg-red border-red text-on-red'
                : 'bg-transparent border-border text-secondary hover:border-muted hover:text-primary'
            }`}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label} ({f.count})
          </button>
        ))}
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

      {!loading && !error && visible.length === 0 && (
        <div className="bg-surface border border-border rounded-md py-12 px-4 text-center text-muted text-sm">
          {routes.length === 0 ? 'Nenhuma rota criada ainda.' : 'Nenhuma rota com este filtro.'}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="flex flex-col gap-4">
          {visible.map(r => (
            <RouteCard
              key={r.id}
              route={r}
              onEdit={setEditing}
              onDelete={handleDelete}
              onAssign={setAssigning}
              onUnassign={handleUnassign}
              onAdvance={handleAdvance}
              onMove={handleMove}
              onPreviewAuto={setPreviewAuto}
              onSaveStopNotes={handleSaveStopNotes}
            />
          ))}
        </div>
      )}

      {editing && (
        <RouteFormModal
          route={editing === 'new' ? null : editing}
          drivers={drivers}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {assigning && (
        <AssignOrdersModal
          route={assigning}
          onClose={() => setAssigning(null)}
          onSaved={handleAssigned}
        />
      )}

      {previewAuto && (
        <AutoRoutePreviewModal
          route={previewAuto}
          onClose={() => setPreviewAuto(null)}
          onApply={handleApplyAutoOrder}
        />
      )}
    </div>
  )
}

export default AdminRoutes
