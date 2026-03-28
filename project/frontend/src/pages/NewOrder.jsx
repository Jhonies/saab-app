import OrderForm from '../components/Orders/OrderForm'

const NewOrder = () => {
  // Placeholder — substituir por dados reais via hook/API
  const products = []

  const handleSubmit = (data) => {
    console.log('Novo pedido:', data)
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Novo Pedido</h1>
      <OrderForm products={products} onSubmit={handleSubmit} />
    </main>
  )
}

export default NewOrder
