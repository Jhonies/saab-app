const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const PRODUCTS = [
  { name: 'Alcatra Bovina',    type: 'Bovino',   pricePerBox: 148.50 },
  { name: 'Costela Bovina',    type: 'Bovino',   pricePerBox: 112.00 },
  { name: 'Pernil Suíno',      type: 'Suíno',    pricePerBox:  89.90 },
  { name: 'Lombo Suíno',       type: 'Suíno',    pricePerBox:  97.50 },
  { name: 'Frango Inteiro',    type: 'Frango',   pricePerBox:  54.00 },
  { name: 'Peito de Frango',   type: 'Frango',   pricePerBox:  72.00 },
  { name: 'Perna de Cordeiro', type: 'Cordeiro', pricePerBox: 165.00 },
]

const CONTAINERS = [
  { label: 'C-01', capacity: 100, quantity: 0   },
  { label: 'C-02', capacity: 100, quantity: 100 },
  { label: 'C-03', capacity: 100, quantity: 45  },
  { label: 'C-04', capacity: 120, quantity: 120 },
  { label: 'C-05', capacity: 80,  quantity: 0   },
  { label: 'C-06', capacity: 100, quantity: 60  },
  { label: 'C-07', capacity: 90,  quantity: 0   },
  { label: 'C-08', capacity: 100, quantity: 100 },
  { label: 'C-09', capacity: 110, quantity: 75  },
  { label: 'C-10', capacity: 80,  quantity: 0   },
  { label: 'C-11', capacity: 100, quantity: 100 },
  { label: 'C-12', capacity: 100, quantity: 30  },
]

const CLIENTS = [
  {
    email: 'frigorifico.norte@saab.com',
    address: 'Rua do Heroísmo 42, Porto',
    lat: 41.149, lon: -8.610,
    deliveryWindowStart: '07:00', deliveryWindowEnd: '10:00',
  },
  {
    email: 'distribuidora.sul@saab.com',
    address: 'Av. da República 88, Faro',
    lat: 37.019, lon: -7.930,
    deliveryWindowStart: '09:00', deliveryWindowEnd: '12:00',
  },
  {
    email: 'supermercado.abc@saab.com',
    address: 'Praça do Comércio, Lisboa',
    lat: 38.707, lon: -9.137,
    deliveryWindowStart: '08:00', deliveryWindowEnd: '11:00',
  },
]

async function main() {
  // Admin
  const adminEmail = 'admin@saab.com'
  const existing   = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const hashed = await bcrypt.hash('123456', 12)
    await prisma.user.create({ data: { email: adminEmail, password: hashed, role: 'ADMIN' } })
    console.log('Admin criado.')
  } else {
    console.log('Admin já existe.')
  }

  // Clientes de teste
  for (const c of CLIENTS) {
    const exists = await prisma.user.findUnique({ where: { email: c.email } })
    if (!exists) {
      const hashed = await bcrypt.hash('123456', 12)
      await prisma.user.create({ data: { email: c.email, password: hashed, role: 'CLIENTE' } })
      console.log(`Cliente criado: ${c.email}`)
    }
  }

  // Actualiza coordenadas/janelas nos pedidos existentes sem coordenadas
  for (const c of CLIENTS) {
    const user = await prisma.user.findUnique({ where: { email: c.email } })
    if (!user) continue
    await prisma.order.updateMany({
      where: { clientId: user.id, lat: null },
      data: {
        address:             c.address,
        lat:                 c.lat,
        lon:                 c.lon,
        deliveryWindowStart: c.deliveryWindowStart,
        deliveryWindowEnd:   c.deliveryWindowEnd,
      },
    })
  }
  console.log('Coordenadas dos pedidos actualizadas.')

  // Products
  const existingProducts = await prisma.product.count()
  if (existingProducts > 0) {
    console.log('Produtos já existem. Seed de inventário ignorado.')
    return
  }

  const products = await Promise.all(
    PRODUCTS.map(p => prisma.product.create({ data: p }))
  )
  console.log(`${products.length} produtos criados.`)

  // Containers — associa produtos aos que têm quantity > 0
  const productCycle = [0, 1, 2, 3, 4, 5, 6, 0, 1, 3, 5, 2]
  await Promise.all(
    CONTAINERS.map((c, i) =>
      prisma.container.create({
        data: {
          label:     c.label,
          capacity:  c.capacity,
          quantity:  c.quantity,
          productId: c.quantity > 0 ? products[productCycle[i]].id : null,
        },
      })
    )
  )
  console.log('12 contêineres criados.')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
