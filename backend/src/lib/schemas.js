const { z } = require('zod')

/* ── Create Order ──
 * NOTA: route/driver não fazem parte da criação. São atribuídos numa
 * etapa separada via módulo de Rotas (POST /routes/:id/assign-orders).
 */
const createOrderSchema = z.object({
  clientId:     z.number().int().positive().nullish(),
  storeId:      z.number().int().positive().nullish(),
  clientName:   z.string().min(1, 'clientName é obrigatório.').nullish(),
  address:      z.string().nullish(),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  items: z.array(z.object({
    productId:   z.number({ required_error: 'productId é obrigatório.' }).int().positive(),
    quantity:    z.number({ required_error: 'quantity é obrigatório.' }).int().positive('Quantidade deve ser um inteiro positivo.'),
    priceType:   z.enum(['PER_LB', 'PER_BOX', 'PER_UNIT']).default('PER_LB'),
    pricePerLb:  z.number().positive('pricePerLb deve ser positivo.').nullish(),
    pricePerBox: z.number().positive('pricePerBox deve ser positivo.').nullish(),
  })).min(1, 'items[] é obrigatório e não pode ser vazio.'),
}).refine(
  d => d.storeId || d.clientId || d.clientName,
  { message: 'storeId, clientId ou clientName é obrigatório.' }
)

/* ── Reassign Route/Driver ──
 * Permite ligar manualmente um pedido a uma rota OU passar route/driver soltos.
 */
const reassignRouteSchema = z.object({
  routeId:  z.number().int().positive().nullable().optional(),
  route:    z.string().nullish(),
  driverId: z.number().int().positive().nullable().optional(),
})

/* ── Pack Order (itemWeights) ── */
const boxWeightSchema = z.object({
  boxNumber:  z.number().int().positive('boxNumber deve ser um inteiro positivo.'),
  weightLb:   z.number().positive('weightLb deve ser maior que 0.'),
  expiryDate: z.string().nullish(),
  batch:      z.string().nullish(),
})

const itemWeightSchema = z.object({
  orderItemId: z.number({ required_error: 'orderItemId é obrigatório.' }).int().positive(),
  boxWeights:  z.array(boxWeightSchema).default([]),
})

const packOrderSchema = z.object({
  itemWeights: z.array(itemWeightSchema).optional(),
})

/* ── Update Status ── */
const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Status deve ser: CONFIRMED | CANCELLED.' }),
  }),
})

module.exports = {
  createOrderSchema,
  packOrderSchema,
  updateStatusSchema,
  reassignRouteSchema,
}
