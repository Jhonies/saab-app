const prisma = require('../lib/prisma')

const list = () =>
  prisma.client.findMany({ orderBy: { name: 'asc' } })

const getById = (id) =>
  prisma.client.findUnique({ where: { id: Number(id) } })

const create = ({ name, address }) =>
  prisma.client.create({ data: { name, address: address || '' } })

const update = (id, { name, address }) => {
  const data = {}
  if (name !== undefined) data.name = name
  if (address !== undefined) data.address = address
  return prisma.client.update({ where: { id: Number(id) }, data })
}

const remove = (id) =>
  prisma.client.delete({ where: { id: Number(id) } })

module.exports = { list, getById, create, update, remove }
