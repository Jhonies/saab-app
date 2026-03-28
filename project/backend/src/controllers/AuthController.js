const bcrypt      = require('bcrypt')
const jwt         = require('jsonwebtoken')
const UserService = require('../services/UserService')

const VALID_ROLES = ['CLIENTE', 'MOTORISTA']

/* ── Login ── */
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password são obrigatórios.' })
  }

  const user = await UserService.findByEmail(email)

  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' })
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Credenciais inválidas.' })
  }

  const payload = { sub: user.id, email: user.email, role: user.role }
  const token   = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  })

  return res.status(200).json({ token })
}

/* ── Register — apenas ADMIN ── */
const register = async (req, res) => {
  const { email, password, role } = req.body

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Email e password são obrigatórios.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' })
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role deve ser: ${VALID_ROLES.join(' | ')}.` })
  }

  const existing = await UserService.findByEmail(email.trim())
  if (existing) {
    return res.status(409).json({ message: 'Email já registado.' })
  }

  const user = await UserService.createUser({
    email:    email.trim().toLowerCase(),
    password,
    role,
  })

  return res.status(201).json(user)
}

/* ── List users — apenas ADMIN ── */
const listUsers = async (req, res) => {
  const { role } = req.query
  const users = await UserService.listUsers(role || undefined)
  return res.json(users)
}

module.exports = { login, register, listUsers }
