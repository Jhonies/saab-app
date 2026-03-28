import ContainerCard from './ContainerCard'

const InventoryList = ({ containers = [] }) => {
  if (containers.length === 0) {
    return <p className="text-gray-400 text-sm">Nenhum contêiner encontrado.</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {containers.map((container) => (
        <ContainerCard key={container.id} container={container} />
      ))}
    </div>
  )
}

export default InventoryList
