const UserService = require('../services/UserService')

/* ── List ── */
const listUsers = async (_req, res) => {
  try {
    const users = await UserService.listUsers()
    return res.json(users)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Create ── */
const createUser = async (req, res) => {
  const { email, password, role } = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Campos obrigatórios: email, password, role.' })
  }

  try {
    const user = await UserService.createUser({ email, password, role })
    return res.status(201).json(user)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Update ── */
const updateUser = async (req, res) => {
  const { email, password, role } = req.body

  if (!email && !password && !role) {
    return res.status(400).json({ message: 'Nenhum campo enviado para actualização.' })
  }

  try {
    const user = await UserService.updateUser(req.params.id, { email, password, role })
    return res.json(user)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

module.exports = { listUsers, createUser, updateUser }
