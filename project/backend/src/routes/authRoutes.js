const { Router } = require('express')
const { login, register, listUsers }     = require('../controllers/AuthController')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')

const router = Router()

/* Público */
router.post('/login', login)

/* Apenas ADMIN */
router.post('/register', authMiddleware, authorizeRoles('ADMIN'), register)
router.get('/users',     authMiddleware, authorizeRoles('ADMIN'), listUsers)

module.exports = router
