const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

/* ───────────────────────────────────────────────────────────────
 * INVENTÁRIO — criar depois com dados reais
 * ─────────────────────────────────────────────────────────────── */
const ZONES = []

/* ───────────────────────────────────────────────────────────────
 * CLIENTES — endereços e janelas de entrega
 * ─────────────────────────────────────────────────────────────── */
const CLIENTS = [
  {
    email: 'frigorifico.norte@saab.com',
    address: '7600 Dr Phillips Blvd, Orlando, FL',
    lat: 28.4488, lon: -81.4940,
    deliveryWindowStart: '07:00', deliveryWindowEnd: '10:00',
  },
  {
    email: 'distribuidora.sul@saab.com',
    address: '5770 W Irlo Bronson Memorial Hwy, Kissimmee, FL',
    lat: 28.3387, lon: -81.4584,
    deliveryWindowStart: '09:00', deliveryWindowEnd: '12:00',
  },
  {
    email: 'supermercado.abc@saab.com',
    address: '4200 Conroy Rd, Orlando, FL',
    lat: 28.4835, lon: -81.4310,
    deliveryWindowStart: '08:00', deliveryWindowEnd: '11:00',
  },
]

/* ───────────────────────────────────────────────────────────────
 * SEED
 * ─────────────────────────────────────────────────────────────── */
async function main() {
  // — Limpar dados existentes
  await prisma.boxWeight.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.container.deleteMany()
  await prisma.product.deleteMany()
  console.log('Cleared existing data')

  // — Utilizadores
  const users = [
    { email: 'admin@saab.com', password: '123456', role: 'ADMIN' },
    { email: 'expedicao@saab.com', password: 'expedicao123', role: 'EXPEDICAO' },
    { email: 'motorista@saab.com', password: 'motorista123', role: 'MOTORISTA' },
    { email: 'vendedor@saab.com', password: 'vendedor123', role: 'VENDEDOR' },
    ...CLIENTS.map(c => ({
      email: c.email,
      password: '123456',
      role: 'CLIENTE',
      address: c.address,
      lat: c.lat,
      lon: c.lon,
      deliveryWindowStart: c.deliveryWindowStart,
      deliveryWindowEnd: c.deliveryWindowEnd,
    })),
  ]

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10)
      await prisma.user.create({
        data: {
          email: u.email,
          password: hashed,
          role: u.role,
          address: u.address ?? '',
          lat: u.lat ?? null,
          lon: u.lon ?? null,
          deliveryWindowStart: u.deliveryWindowStart ?? '08:00',
          deliveryWindowEnd: u.deliveryWindowEnd ?? '18:00',
        },
      })
      console.log(`Created user: ${u.email}`)
    }
  }

  // — Produtos e Contêineres
  console.log('Seeding products and containers...');
  const seedDataPath = require('path').join(__dirname, 'seed_data.json');
  const items = JSON.parse(require('fs').readFileSync(seedDataPath, 'utf8'));

  // Collect unique products
  const productSet = new Set();
  items.forEach(i => productSet.add(i.name.toLowerCase()));

  // Create products in DB
  const productMap = {}; // name -> db id
  let pIndex = 1;
  for (const pName of productSet) {
    const created = await prisma.product.create({
      data: {
        name: pName,
        type: 'Outros' // generic type since it's not specified
      }
    });
    productMap[pName] = created.id;
    pIndex++;
  }
  console.log(`Created ${pIndex - 1} products.`);

  // Create containers
  const zoneCounters = {}; // To generate Labels like CF-001
  let cIndex = 0;

  for (const item of items) {
    if (!zoneCounters[item.zone]) zoneCounters[item.zone] = 1;
    let prefix = item.zone;
    if (prefix.startsWith('CONTAINER_')) prefix = 'CT' + prefix.split('_')[1];
    else if (prefix === 'CAMARA_FRIA') prefix = 'CF';
    else if (prefix === 'BEBIDAS') prefix = 'SB';
    else if (prefix === 'SECOS') prefix = 'SN'; // simplified

    const label = `${prefix}-${String(zoneCounters[item.zone]++).padStart(3, '0')}`;
    
    await prisma.container.create({
      data: {
        label: label,
        zone: item.zone,
        capacity: 1000,
        quantity: item.qty,
        unit: item.unit === 'unidade' || item.unit === 'unidades' ? 'unidades' : 'caixas',
        productId: productMap[item.name.toLowerCase()]
      }
    });
    cIndex++;
  }
  console.log(`Created ${cIndex} containers.`);
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())