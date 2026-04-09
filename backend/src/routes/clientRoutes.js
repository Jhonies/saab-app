const { Router } = require('express')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')
const { list, create, update, remove } = require('../controllers/ClientController')

const router = Router()

router.use(authMiddleware)

router.get('/',       authorizeRoles('ADMIN', 'VENDEDOR'), list)
router.post('/',      authorizeRoles('ADMIN', 'VENDEDOR'), create)
router.patch('/:id',  authorizeRoles('ADMIN'),             update)
router.delete('/:id', authorizeRoles('ADMIN'),             remove)

module.exports = router
