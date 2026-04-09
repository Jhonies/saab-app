const ClientService = require('../services/ClientService')

const list = async (_req, res, next) => {
  try {
    const clients = await ClientService.list()
    return res.json(clients)
  } catch (err) { next(err) }
}

const create = async (req, res) => {
  const { name, address } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'Nome do cliente é obrigatório.' })

  try {
    const client = await ClientService.create({ name: name.trim(), address: address?.trim() })
    return res.status(201).json(client)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const update = async (req, res) => {
  const { name, address } = req.body
  try {
    const client = await ClientService.update(req.params.id, { name: name?.trim(), address: address?.trim() })
    return res.json(client)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

const remove = async (req, res) => {
  try {
    await ClientService.remove(req.params.id)
    return res.status(204).end()
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

module.exports = { list, create, update, remove }
