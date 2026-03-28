const { PrismaClient } = require('@prisma/client')
const bcrypt           = require('bcrypt')

const prisma = new PrismaClient()

const listClients = () =>
  prisma.user.findMany({
    where:   { role: 'CLIENTE' },
    select:  { id: true, email: true },
    orderBy: { email: 'asc' },
  })

const listUsers = (role) =>
  prisma.user.findMany({
    where:   role ? { role } : undefined,
    select:  { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } })

const createUser = async ({ email, password, role }) => {
  const hashed = await bcrypt.hash(password, 12)
  return prisma.user.create({
    data:   { email, password: hashed, role },
    select: { id: true, email: true, role: true, createdAt: true },
  })
}

module.exports = { listClients, listUsers, findByEmail, createUser }
