const InventoryService = require('../services/InventoryService')

/* ── Containers ── */

const listContainers = async (_req, res) => {
  const containers = await InventoryService.getAllContainers()
  return res.json(containers)
}

const getContainer = async (req, res) => {
  const container = await InventoryService.getContainerById(req.params.id)
  if (!container) return res.status(404).json({ message: 'Contêiner não encontrado.' })
  return res.json(container)
}

const updateContainer = async (req, res) => {
  const { quantity, productId } = req.body

  if (quantity !== undefined && (isNaN(quantity) || quantity < 0)) {
    return res.status(400).json({ message: 'Quantidade inválida.' })
  }

  const container = await InventoryService.updateContainer(req.params.id, {
    ...(quantity  !== undefined && { quantity: Number(quantity) }),
    ...(productId !== undefined && { productId: productId ? Number(productId) : null }),
  })
  return res.json(container)
}

/* ── Products ── */

const listProducts = async (_req, res) => {
  const products = await InventoryService.getAllProducts()
  return res.json(products)
}

const createProduct = async (req, res) => {
  const { name, type, pricePerBox } = req.body

  if (!name?.trim() || !type?.trim()) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios.' })
  }

  const product = await InventoryService.createProduct({
    name:        name.trim(),
    type:        type.trim(),
    pricePerBox: pricePerBox != null ? Number(pricePerBox) : 0,
  })
  return res.status(201).json(product)
}

const updateProduct = async (req, res) => {
  const { name, type, pricePerBox } = req.body

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ message: 'Nome não pode ser vazio.' })
  }

  const product = await InventoryService.updateProduct(req.params.id, {
    ...(name        !== undefined && { name: name.trim() }),
    ...(type        !== undefined && { type: type.trim() }),
    ...(pricePerBox !== undefined && { pricePerBox: Number(pricePerBox) }),
  })
  return res.json(product)
}

const deleteProduct = async (req, res) => {
  try {
    await InventoryService.deleteProduct(req.params.id)
    return res.status(204).end()
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ message: 'Produto em uso — remova-o dos contêineres primeiro.' })
    }
    throw err
  }
}

module.exports = {
  listContainers,
  getContainer,
  updateContainer,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}
