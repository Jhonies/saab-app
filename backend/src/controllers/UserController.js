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
  const { name, email, password, role, address, lat, lon } = req.body

  try {
    const user = await UserService.createUser({ name, email, password, role, address, lat, lon })
    return res.status(201).json(user)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Update ── */
const updateUser = async (req, res) => {
  const { name, email, password, role, address, lat, lon } = req.body

  try {
    const user = await UserService.updateUser(req.params.id, { name, email, password, role, address, lat, lon })
    return res.json(user)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

module.exports = { listUsers, createUser, updateUser }
