import { useState } from 'react'
import ProductSelector from './ProductSelector'

const OrderForm = ({ products = [], onSubmit }) => {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [weight, setWeight] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}

    if (!productId) newErrors.productId = 'Selecione um produto.'

    const qty = Number(quantity)
    if (!quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      newErrors.quantity = 'Quantidade deve ser um número inteiro positivo (caixas).'
    }

    const kg = Number(weight)
    if (!weight || isNaN(kg) || kg <= 0) {
      newErrors.weight = 'Peso deve ser um número positivo (kg).'
    }

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    onSubmit?.({ productId, quantity: Number(quantity), weight: Number(weight) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <ProductSelector products={products} value={productId} onChange={setProductId} />
      {errors.productId && <p className="text-red-500 text-xs">{errors.productId}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Quantidade (caixas)</label>
        <input
          type="number"
          min="1"
          step="1"
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Ex: 10"
        />
        {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Peso total (kg)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Ex: 150.5"
        />
        {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Criar Pedido
      </button>
    </form>
  )
}

export default OrderForm
