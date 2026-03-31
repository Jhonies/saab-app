const Dashboard = () => {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Contêineres ativos</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Pedidos hoje</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Peso total (kg)</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
