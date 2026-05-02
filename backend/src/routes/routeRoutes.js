const { Router } = require('express')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')
const { getDailyRoute } = require('../controllers/RouteController')
const RoutePlan = require('../controllers/RoutePlanController')

const router = Router()

router.use(authMiddleware)

/* ── Rota diária do motorista (cálculo dinâmico) ── */
router.get('/daily', authorizeRoles('ADMIN', 'MOTORISTA'), getDailyRoute)

/* ── Pedidos disponíveis para atribuição ── */
router.get('/assignable-orders', authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.listAssignableOrders)

/* ── Rotas atribuídas ao motorista logado ── */
router.get('/mine', authorizeRoles('MOTORISTA'), RoutePlan.listMine)

/* ── CRUD de Rotas ── */
router.get('/',    authorizeRoles('ADMIN', 'EXPEDICAO', 'VENDEDOR'), RoutePlan.list)
router.post('/',   authorizeRoles('ADMIN', 'EXPEDICAO'),             RoutePlan.create)
router.get('/:id', authorizeRoles('ADMIN', 'EXPEDICAO', 'VENDEDOR'), RoutePlan.getOne)
router.patch('/:id',  authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.update)
router.delete('/:id', authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.remove)

/* ── Assign / Unassign / Reorder / Stop notes ── */
router.post('/:id/assign-orders',           authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.assignOrders)
router.patch('/:id/reorder',                authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.reorderStops)
router.patch('/:id/orders/:orderId/notes',  authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.updateStopNotes)
router.delete('/:id/orders/:orderId',       authorizeRoles('ADMIN', 'EXPEDICAO'), RoutePlan.unassignOrder)

module.exports = router
