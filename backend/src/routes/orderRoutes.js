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
  separateOrder,
  packOrder,
  loadOrder,
  signOrder,
} = require('../controllers/OrderController')

const router = Router()

router.use(authMiddleware)

/* Rotas específicas ANTES de /:id para evitar colisões */
router.get('/clients',        authorizeRoles('ADMIN'),                              listClients)
router.get('/:id/invoice',    authorizeRoles('ADMIN', 'CLIENTE'),                   getInvoice)
router.patch('/:id/deliver',  authorizeRoles('ADMIN', 'MOTORISTA'),                 deliverOrder)
router.patch('/:id/status',   authorizeRoles('ADMIN', 'EXPEDICAO'),                 updateStatus)
router.patch('/:id/separate', authorizeRoles('ADMIN', 'EXPEDICAO'),                 separateOrder)
router.patch('/:id/pack',     authorizeRoles('ADMIN', 'EXPEDICAO'),                 packOrder)
router.patch('/:id/load',     authorizeRoles('MOTORISTA'),                          loadOrder)
router.patch('/:id/sign',     authorizeRoles('ADMIN', 'CLIENTE'),                    signOrder)

router.get('/',    authorizeRoles('ADMIN', 'EXPEDICAO', 'MOTORISTA', 'CLIENTE'), listOrders)
router.post('/',   authorizeRoles('ADMIN', 'CLIENTE'),                           createOrder)
router.get('/:id', authorizeRoles('ADMIN', 'EXPEDICAO', 'MOTORISTA', 'CLIENTE'), getOrder)

module.exports = router
