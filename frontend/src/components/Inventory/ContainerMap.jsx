const MOCK_CONTAINERS = [
  { id: 'C-01', meatType: 'Frango',   status: 'empty'    },
  { id: 'C-02', meatType: 'Bovino',   status: 'full'     },
  { id: 'C-03', meatType: 'Suíno',    status: 'partial'  },
  { id: 'C-04', meatType: 'Bovino',   status: 'full'     },
  { id: 'C-05', meatType: 'Frango',   status: 'empty'    },
  { id: 'C-06', meatType: 'Cordeiro', status: 'partial'  },
  { id: 'C-07', meatType: 'Suíno',    status: 'empty'    },
  { id: 'C-08', meatType: 'Bovino',   status: 'full'     },
  { id: 'C-09', meatType: 'Frango',   status: 'partial'  },
  { id: 'C-10', meatType: 'Cordeiro', status: 'empty'    },
  { id: 'C-11', meatType: 'Bovino',   status: 'full'     },
  { id: 'C-12', meatType: 'Suíno',    status: 'partial'  },
]

const STATUS_CONFIG = {
  empty:   { label: 'Vazio',   dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700'  },
  partial: { label: 'Parcial', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  full:    { label: 'Cheio',   dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700'      },
}

const ContainerCard = ({ id, meatType, status }) => {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-gray-400 uppercase">{id}</span>
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
          <span className={`h-2 w-2 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-700">{meatType}</p>
    </div>
  )
}

const ContainerMap = ({ containers = MOCK_CONTAINERS }) => {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-800">Mapa de Contêineres</h2>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {containers.map((c) => (
          <ContainerCard key={c.id} {...c} />
        ))}
      </div>
    </section>
  )
}

export default ContainerMap
