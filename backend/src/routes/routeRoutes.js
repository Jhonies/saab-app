const { Router } = require('express')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')
const { getDailyRoute } = require('../controllers/RouteController')

const router = Router()

router.use(authMiddleware)
router.get('/daily', authorizeRoles('ADMIN', 'MOTORISTA'), getDailyRoute)

module.exports = router
