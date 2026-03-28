const RouteService = require('../services/RouteService')

const getDailyRoute = async (_req, res) => {
  try {
    const route = await RouteService.getDailyRoute()
    return res.json(route)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

module.exports = { getDailyRoute }
