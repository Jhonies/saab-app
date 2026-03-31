/**
 * Categorias de produto.
 * O campo `type` no DB armazena a categoria directamente (e.g. "Bovino", "Bebidas").
 */

export const CATEGORIES = [
  { key: 'Bovino',      label: 'Bovino'      },
  { key: 'Suíno',       label: 'Suíno'       },
  { key: 'Aves',        label: 'Aves'        },
  { key: 'Miúdos',      label: 'Miúdos'      },
  { key: 'Laticínios',  label: 'Laticínios'  },
  { key: 'Congelados',  label: 'Congelados'  },
  { key: 'Secos',       label: 'Secos'       },
  { key: 'Bebidas',     label: 'Bebidas'     },
  { key: 'Outros',      label: 'Outros'      },
]

/** Flat list of category keys for selects */
export const ALL_TYPE_OPTIONS = CATEGORIES.map(c => c.key)
