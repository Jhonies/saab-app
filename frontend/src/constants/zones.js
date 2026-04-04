export const ZONE_CONFIG = [
  { key: 'CAMARA_FRIA',   label: 'Camara fria' },
  { key: 'CONTAINER_31',  label: 'Container 31' },
  { key: 'CONTAINER_32',  label: 'Container 32' },
  { key: 'CONTAINER_33',  label: 'Container 33' },
  { key: 'CONTAINER_36',  label: 'Container 36' },
  { key: 'BEBIDAS',       label: 'Bebidas' },
  { key: 'SECOS',         label: 'Secos' },
]

export const ZONE_LABELS = Object.fromEntries(
  ZONE_CONFIG.map(z => [z.key, z.label])
)

// Map container label prefixes to full names
export const LABEL_PREFIX_MAP = {
  'CT36': 'Container 36',
  'CT33': 'Container 33',
  'CT32': 'Container 32',
  'CT31': 'Container 31',
  'CF':   'Câmara Fria',
  'SB':   'Bebidas',
  'SN':   'Secos',
}

// Expand a label like "CF-001" → "Câmara Fria 001"
export const expandLabel = (label) => {
  const match = label.match(/^([A-Z0-9]+)-(.+)$/)
  if (!match) return label
  const [, prefix, number] = match
  const fullName = LABEL_PREFIX_MAP[prefix]
  return fullName ? `${fullName} ${number}` : label
}
