const { Router } = require('express')
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware')
const {
  listContainers,
  getContainer,
  updateContainer,
  listProducts,
  getProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/InventoryController')

const router = Router()

router.use(authMiddleware)

/* ── Containers ── */
router.get('/containers',       authorizeRoles('ADMIN', 'CLIENTE', 'EXPEDICAO', 'VENDEDOR'), listContainers)
router.get('/containers/:id',   authorizeRoles('ADMIN', 'CLIENTE', 'EXPEDICAO', 'VENDEDOR'), getContainer)
router.patch('/containers/:id', authorizeRoles('ADMIN'),            updateContainer)

/* ── Products ── */
router.get('/products',             authorizeRoles('ADMIN', 'CLIENTE', 'EXPEDICAO', 'VENDEDOR'), listProducts)
router.get('/products/:id/stock',   authorizeRoles('ADMIN', 'VENDEDOR', 'EXPEDICAO'),            getProductStock)
router.post('/products',            authorizeRoles('ADMIN'),            createProduct)
router.patch('/products/:id',       authorizeRoles('ADMIN'),            updateProduct)
router.delete('/products/:id',      authorizeRoles('ADMIN'),            deleteProduct)

module.exports = router
