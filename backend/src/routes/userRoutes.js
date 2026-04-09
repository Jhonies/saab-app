const { Router } = require('express')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')
const { listUsers, createUser, updateUser } = require('../controllers/UserController')

const router = Router()

router.use(authMiddleware)

router.get('/',      authorizeRoles('ADMIN'), listUsers)
router.post('/',     authorizeRoles('ADMIN'), createUser)
router.patch('/:id', authorizeRoles('ADMIN'), updateUser)

module.exports = router
