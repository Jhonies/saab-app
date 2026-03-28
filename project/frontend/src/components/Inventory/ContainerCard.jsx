const ContainerCard = ({ container }) => {
  const { id, label, status, itemCount } = container

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{label}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            status === 'available'
              ? 'bg-green-100 text-green-700'
              : status === 'full'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-xs text-gray-500">ID: {id}</p>
      <p className="text-xs text-gray-500">Itens: {itemCount ?? 0} caixas</p>
    </div>
  )
}

export default ContainerCard
