export const ZONE_CONFIG = [
  { key: 'CAMARA_FRIA',      label: 'Câmara Fria'        },
  { key: 'CAMARA_FRIA_FORA', label: 'Câmara Fria / Fora' },
  { key: 'CONTAINERS',       label: 'Containers'         },
  { key: 'SECOS',            label: 'Secos'              },
  { key: 'OPEN_BOX',         label: 'Open Box'           },
]

export const ZONE_LABELS = Object.fromEntries(
  ZONE_CONFIG.map(z => [z.key, z.label])
)

export const SUBZONE_LABELS = {
  NASSIF:  'Nassif',
  SAAB:    'Saab',
  BEBIDAS: 'Bebidas',
}
