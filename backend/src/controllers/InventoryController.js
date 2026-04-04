const InventoryService = require('../services/InventoryService')

/* ── Containers ── */

const listContainers = async (req, res) => {
  const { zone } = req.query
  const containers = await InventoryService.getAllContainers({ zone })
  return res.json(containers)
}

const getContainer = async (req, res) => {
  const container = await InventoryService.getContainerById(req.params.id)
  if (!container) return res.status(404).json({ message: 'Contêiner não encontrado.' })
  return res.json(container)
}

const updateContainer = async (req, res) => {
  const { capacity, quantity, productId, unit } = req.body

  if (capacity !== undefined && (isNaN(capacity) || capacity < 0 || capacity > 9999)) {
    return res.status(400).json({ message: 'Capacidade inválida (0–9999).' })
  }

  if (quantity !== undefined && (isNaN(quantity) || quantity < 0)) {
    return res.status(400).json({ message: 'Quantidade inválida.' })
  }

  const container = await InventoryService.updateContainer(req.params.id, {
    ...(capacity  !== undefined && { capacity: Number(capacity) }),
    ...(quantity  !== undefined && { quantity: Number(quantity) }),
    ...(unit      !== undefined && { unit: String(unit) }),
    ...(productId !== undefined && { productId: productId ? Number(productId) : null }),
  })
  return res.json(container)
}

/* ── Products ── */

const listProducts = async (req, res) => {
  const includeInactive = req.query.all === 'true' && req.user.role === 'ADMIN'
  const products = await InventoryService.getAllProducts({ includeInactive })
  return res.json(products)
}

const getProductStock = async (req, res) => {
  const stock = await InventoryService.getProductStock(req.params.id)
  return res.json(stock)
}

const createProduct = async (req, res) => {
  const { name, type } = req.body

  if (!name?.trim() || !type?.trim()) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios.' })
  }

  const product = await InventoryService.createProduct({
    name: name.trim(),
    type: type.trim(),
  })
  return res.status(201).json(product)
}

const updateProduct = async (req, res) => {
  const { name, type, active } = req.body

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ message: 'Nome não pode ser vazio.' })
  }

  const product = await InventoryService.updateProduct(req.params.id, {
    ...(name   !== undefined && { name: name.trim() }),
    ...(type   !== undefined && { type: type.trim() }),
    ...(active !== undefined && { active: Boolean(active) }),
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
  getProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
}
