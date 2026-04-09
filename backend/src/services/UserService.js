const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')

const USER_SELECT = { id: true, name: true, email: true, role: true, address: true, lat: true, lon: true, createdAt: true }

const VALID_ROLES = ['ADMIN', 'EXPEDICAO', 'MOTORISTA', 'VENDEDOR']

const listUsers = (role) =>
  prisma.user.findMany({
    where:   role ? { role } : { role: { in: VALID_ROLES } },
    select:  USER_SELECT,
    orderBy: { createdAt: 'desc' },
  })

const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } })

const createUser = async ({ name, email, password, role, address, lat, lon }) => {
  if (!email?.trim()) {
    throw Object.assign(new Error('Email é obrigatório.'), { status: 400 })
  }

  if (!password || password.length < 6) {
    throw Object.assign(new Error('Password deve ter pelo menos 6 caracteres.'), { status: 400 })
  }

  if (!VALID_ROLES.includes(role)) {
    throw Object.assign(new Error(`Role inválida. Valores aceites: ${VALID_ROLES.join(', ')}.`), { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    throw Object.assign(new Error('Este email já está registado.'), { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  return prisma.user.create({
    data: {
      name:   name?.trim() ?? '',
      email:  normalizedEmail,
      password: hashed,
      role,
      address: address?.trim() ?? '',
      lat:     lat != null ? Number(lat) : null,
      lon:     lon != null ? Number(lon) : null,
    },
    select: USER_SELECT,
  })
}

const updateUser = async (id, { name, email, password, role, address, lat, lon }) => {
  const current = await prisma.user.findUnique({ where: { id: Number(id) } })
  if (!current) {
    throw Object.assign(new Error('Utilizador não encontrado.'), { status: 404 })
  }

  if (role && !VALID_ROLES.includes(role)) {
    throw Object.assign(new Error(`Role inválida. Valores aceites: ${VALID_ROLES.join(', ')}.`), { status: 400 })
  }

  // Verifica duplicação de email (apenas se for fornecido email)
  if (email && email.trim().toLowerCase() !== current.email) {
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      throw Object.assign(new Error('Este email já está registado.'), { status: 409 })
    }
  }

  const data = {}
  if (name !== undefined)       data.name     = name.trim()
  if (email)                    data.email    = email.trim().toLowerCase()
  if (role)                     data.role     = role
  if (password) {
    if (password.length < 6) {
      throw Object.assign(new Error('Password deve ter pelo menos 6 caracteres.'), { status: 400 })
    }
    data.password = await bcrypt.hash(password, 12)
  }
  if (address !== undefined) data.address = address.trim()
  if (lat !== undefined)  data.lat      = lat != null ? Number(lat) : null
  if (lon !== undefined)  data.lon      = lon != null ? Number(lon) : null

  return prisma.user.update({
    where:  { id: Number(id) },
    data,
    select: USER_SELECT,
  })
}

module.exports = { listUsers, findByEmail, createUser, updateUser }
