/** Canonical order-status configuration — single source of truth */

export const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',      color: '#b45309', bg: '#b4530918' },
  CONFIRMED:  { label: 'Confirmado',    color: '#a0a0a0', bg: '#a0a0a025' },
  SEPARATING: { label: 'Em Separação',  color: '#4a4a4a', bg: '#4a4a4a18' },
  READY:      { label: 'Pronto',        color: '#15803d', bg: '#15803d18' },
  IN_TRANSIT: { label: 'Em Trânsito',   color: '#505050', bg: '#50505018' },
  DELIVERED:  { label: 'Entregue',      color: '#15803d', bg: '#15803d18' },
  CANCELLED:  { label: 'Cancelado',     color: '#f87171', bg: '#f8717118' },
}

/** Just the labels  — handy for lightweight consumers */
export const STATUS_LABEL = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label]),
)

/** Just the colours */
export const STATUS_COLOR = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.color]),
)

/** Fallback for unknown statuses */
export const STATUS_FALLBACK = { label: '', color: '#888', bg: '#88888818' }
