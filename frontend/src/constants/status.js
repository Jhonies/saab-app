/** Canonical order-status configuration — single source of truth */

export const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',      color: '#d97706', bg: '#d9770618' },
  CONFIRMED:  { label: 'Confirmado',    color: '#3b82f6', bg: '#3b82f618' },
  SEPARATING: { label: 'Em Separação',  color: '#8b5cf6', bg: '#8b5cf618' },
  READY:      { label: 'Pronto',        color: '#22c55e', bg: '#22c55e18' },
  IN_TRANSIT: { label: 'Em Trânsito',   color: '#0ea5e9', bg: '#0ea5e918' },
  DELIVERED:  { label: 'Entregue',      color: '#10b981', bg: '#10b98118' },
  CANCELLED:  { label: 'Cancelado',     color: '#ef4444', bg: '#ef444418' },
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
