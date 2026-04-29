const RouteService = require('../services/RouteService')

const getDailyRoute = async (req, res) => {
  try {
    // MOTORISTA vê apenas pedidos atribuídos a si; ADMIN vê todos.
    const driverId = req.user.role === 'MOTORISTA' ? req.user.sub : null
    const route = await RouteService.getDailyRoute({ driverId })
    return res.json(route)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

module.exports = { getDailyRoute }
