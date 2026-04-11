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
    updatedById: req.user.sub,
  })
  return res.json(container)
}

/* ── Products ── */

const listProducts = async (req, res) => {
  const includeInactive = req.query.all === 'true' && req.user.role === 'ADMIN'
  const products = await InventoryService.getAllProducts({ includeInactive })
  return res.json(products)
}

const searchProducts = async (req, res) => {
  const { q } = req.query
  if (!q || q.trim().length < 2) {
    return res.json([])
  }
  const products = await InventoryService.searchProducts(q.trim())
  return res.json(products)
}

const getProductStock = async (req, res) => {
  const stock = await InventoryService.getProductStock(req.params.id)
  return res.json(stock)
}

const createProduct = async (req, res) => {
  const { name, type, priceType, pricePerLb, pricePerBox, pricePerUnit } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Nome é obrigatório.' })
  }

  const product = await InventoryService.createProduct({
    name: name.trim().toUpperCase(),
    type: '',
    priceType,
    pricePerLb: pricePerLb ? Number(pricePerLb) : null,
    pricePerBox: pricePerBox ? Number(pricePerBox) : null,
    pricePerUnit: pricePerUnit ? Number(pricePerUnit) : null,
  })
  return res.status(201).json(product)
}

const updateProduct = async (req, res) => {
  const { name, type, active, priceType, pricePerLb, pricePerBox, pricePerUnit } = req.body

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ message: 'Nome não pode ser vazio.' })
  }

  const product = await InventoryService.updateProduct(req.params.id, {
    ...(name   !== undefined && { name: name.trim().toUpperCase() }),
    ...(active !== undefined && { active: Boolean(active) }),
    ...(priceType !== undefined && { priceType }),
    ...(pricePerLb !== undefined && { pricePerLb: pricePerLb ? Number(pricePerLb) : null }),
    ...(pricePerBox !== undefined && { pricePerBox: pricePerBox ? Number(pricePerBox) : null }),
    ...(pricePerUnit !== undefined && { pricePerUnit: pricePerUnit ? Number(pricePerUnit) : null }),
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

/* ── Consolidated Stock ── */

const getConsolidatedStock = async (_req, res) => {
  const stock = await InventoryService.getConsolidatedStock()
  return res.json(stock)
}

/* ── GTIN ── */

const lookupGtin = async (req, res) => {
  const mapping = await InventoryService.findProductByGtin(req.params.gtin)
  if (!mapping) return res.status(404).json({ message: 'GTIN não encontrado.' })
  return res.json(mapping)
}

const createGtinMapping = async (req, res) => {
  const { gtin, productId } = req.body
  if (!gtin?.trim() || !productId) {
    return res.status(400).json({ message: 'GTIN e productId são obrigatórios.' })
  }
  try {
    const mapping = await InventoryService.createGtinMapping(gtin.trim(), productId)
    return res.status(201).json(mapping)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'GTIN já registrado.' })
    }
    throw err
  }
}

const listGtinMappings = async (_req, res) => {
  const mappings = await InventoryService.listGtinMappings()
  return res.json(mappings)
}

module.exports = {
  listContainers,
  getContainer,
  updateContainer,
  listProducts,
  searchProducts,
  getProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
  getConsolidatedStock,
  lookupGtin,
  createGtinMapping,
  listGtinMappings,
}
