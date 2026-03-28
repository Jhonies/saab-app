const { Router } = require('express')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')
const {
  createOrder,
  listOrders,
  getOrder,
  listClients,
  deliverOrder,
  updateStatus,
  getInvoice,
} = require('../controllers/OrderController')

const router = Router()

router.use(authMiddleware)

/* Rotas específicas ANTES de /:id para evitar colisões */
router.get('/clients',       authorizeRoles('ADMIN'),                       listClients)
router.get('/:id/invoice',   authorizeRoles('ADMIN', 'CLIENTE'),            getInvoice)
router.patch('/:id/deliver', authorizeRoles('ADMIN', 'MOTORISTA'),          deliverOrder)
router.patch('/:id/status',  authorizeRoles('ADMIN'),                       updateStatus)

router.get('/',    authorizeRoles('ADMIN', 'CLIENTE', 'MOTORISTA'), listOrders)
router.post('/',   authorizeRoles('ADMIN'),                          createOrder)
router.get('/:id', authorizeRoles('ADMIN', 'CLIENTE', 'MOTORISTA'), getOrder)

module.exports = router
