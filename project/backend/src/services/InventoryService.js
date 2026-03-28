const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/* ── Containers ── */

const getAllContainers = () =>
  prisma.container.findMany({
    orderBy: { label: 'asc' },
    include: { product: true },
  })

const getContainerById = (id) =>
  prisma.container.findUnique({
    where: { id: Number(id) },
    include: { product: true },
  })

const updateContainer = (id, data) =>
  prisma.container.update({
    where: { id: Number(id) },
    data,
    include: { product: true },
  })

/* ── Products ── */

const getAllProducts = () =>
  prisma.product.findMany({ orderBy: { name: 'asc' } })

const createProduct = ({ name, type, pricePerBox }) =>
  prisma.product.create({ data: { name, type, pricePerBox } })

const updateProduct = (id, data) =>
  prisma.product.update({ where: { id: Number(id) }, data })

const deleteProduct = async (id) => {
  const numId = Number(id)

  const [inContainers, inOrders] = await Promise.all([
    prisma.container.count({ where: { productId: numId } }),
    prisma.orderItem.count({ where: { productId: numId } }),
  ])

  if (inContainers > 0 || inOrders > 0) {
    const err = new Error('Produto em uso')
    err.statusCode = 409
    throw err
  }

  return prisma.product.delete({ where: { id: numId } })
}

module.exports = {
  getAllContainers,
  getContainerById,
  updateContainer,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}
