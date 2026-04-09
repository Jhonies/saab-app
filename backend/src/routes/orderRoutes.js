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
} = require('../controllers/OrderController')

const router = Router()

router.use(authMiddleware)

/* Rotas específicas ANTES de /:id para evitar colisões */
router.get('/clients',        authorizeRoles('ADMIN', 'VENDEDOR'),                     listClients)
router.get('/:id/invoice',    authorizeRoles('ADMIN', 'VENDEDOR', 'EXPEDICAO'),         getInvoice)
router.patch('/:id/deliver',  authorizeRoles('ADMIN', 'MOTORISTA'),                     deliverOrder)
router.patch('/:id/status',   authorizeRoles('ADMIN', 'EXPEDICAO'),                     updateStatus)
router.patch('/:id/separate', authorizeRoles('ADMIN', 'EXPEDICAO'),                     separateOrder)
router.patch('/:id/pack',     authorizeRoles('ADMIN', 'EXPEDICAO'),                     packOrder)
router.patch('/:id/load',     authorizeRoles('MOTORISTA'),                              loadOrder)

router.get('/',    authorizeRoles('ADMIN', 'EXPEDICAO', 'MOTORISTA', 'VENDEDOR'), listOrders)
router.post('/',   authorizeRoles('ADMIN', 'VENDEDOR'),                                      createOrder)
router.get('/:id', authorizeRoles('ADMIN', 'EXPEDICAO', 'MOTORISTA', 'VENDEDOR'), getOrder)

module.exports = router
