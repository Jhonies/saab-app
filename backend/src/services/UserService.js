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

const VALID_ROLES = ['ADMIN', 'EXPEDICAO', 'MOTORISTA', 'CLIENTE']

const createUser = async ({ email, password, role }) => {
  if (!VALID_ROLES.includes(role)) {
    throw Object.assign(new Error(`Role inválida. Valores aceites: ${VALID_ROLES.join(', ')}.`), { status: 400 })
  }
  const hashed = await bcrypt.hash(password, 12)
  return prisma.user.create({
    data:   { email, password: hashed, role },
    select: { id: true, email: true, role: true, createdAt: true },
  })
}

const updateUser = async (id, { email, password, role }) => {
  if (role && !VALID_ROLES.includes(role)) {
    throw Object.assign(new Error(`Role inválida. Valores aceites: ${VALID_ROLES.join(', ')}.`), { status: 400 })
  }

  const data = {}
  if (email)    data.email    = email
  if (role)     data.role     = role
  if (password) data.password = await bcrypt.hash(password, 12)

  return prisma.user.update({
    where:  { id: Number(id) },
    data,
    select: { id: true, email: true, role: true, createdAt: true },
  })
}

module.exports = { listClients, listUsers, findByEmail, createUser, updateUser }
