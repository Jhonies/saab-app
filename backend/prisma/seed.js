const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

/* ───────────────────────────────────────────────────────────────
 * INVENTÁRIO REAL — cada entrada: [nome, quantidade, tipo]
 * ─────────────────────────────────────────────────────────────── */

// ===================== CÂMARA FRIA =====================
const CF = [
  ['Chuck Short Ribs Creekstone',    7,  'Bovino'],
  ['Short Rib Plate NC',             1,  'Bovino'],
  ['Inside Round Omaha',             5,  'Bovino'],
  ['Pork Belly Sadia',               1,  'Suíno'],
  ['Boneless Beef Top Sirloin IBP',  2,  'Bovino'],
  ['Queijo em Barra',                3,  'Laticínios'],
  ['Short Ribs Macesa',             48,  'Bovino'],
  ['Catupiry',                      38,  'Laticínios'],
  ['Beef Eye Round Macesa',         17,  'Bovino'],
  ['Chuck Roll Diezmillo Sukarne',   1,  'Bovino'],
  ['Pork Belly Patel',               1,  'Suíno'],
  ['Tripa para Tacos',               2,  'Miúdos'],
  ['Pork Belly Daisyfield',          3,  'Suíno'],
  ['Tri Tip Macesa',                37,  'Bovino'],
  ['Hind Shank Pradera',             3,  'Bovino'],   // 1 + 2 (aparece 2× na lista)
  ['Chuck Roll Bone In Sukarne',     1,  'Bovino'],
  ['Tenderloin 3/4 BR',              4,  'Bovino'],
  ['Picanha Wagyu SRF',              7,  'Bovino'],
  ['Outside Round NC',               9,  'Bovino'],
  ['Flap Meat Wingham',              1,  'Bovino'],
  ['Knuckle Sukarne',                1,  'Bovino'],
  ['Bone In Pradera',                1,  'Bovino'],
  ['Picanha IBP Choice',             4,  'Bovino'],
  ['Beef Flat Iron Macesa',         19,  'Bovino'],
  ['Picanha Greenstock',            11,  'Bovino'],
  ['Ribeye NC',                     13,  'Bovino'],
  ['Knuckle Arrebeef',              39,  'Bovino'],
  ['Inside Round NC',               14,  'Bovino'],
  ['Tenderloin 5uP',                 1,  'Bovino'],
  ['Rose Meat Pradera',              2,  'Bovino'],
  ['Heel Meat SM',                  14,  'Bovino'],
  ['Flap Meat Uruguaio',            23,  'Bovino'],
  ['Flat Bottom National',           2,  'Bovino'],
  ['Pork Smoked Lee',                1,  'Suíno'],
  ['Beef Round Flat Creekstone',     8,  'Bovino'],
  ['Chuck Roll NC',                 34,  'Bovino'],
  ['Pork Sirloin Roast Wholestone',  1,  'Suíno'],
]

// ===================== CÂMARA FRIA / FORA =====================
const CFF = [
  ['Queijo em Barra',                50, 'Laticínios'],
  ['Pork Belly Altosano',           27,  'Suíno'],
  ['Sirloin Butt NC',               10,  'Bovino'],
  ['Short Ribs NC',                  29, 'Bovino'],
  ['Ribeye NC',                       1, 'Bovino'],
  ['Rose Meat Pradera',               1, 'Bovino'],
  ['Assado de Tira NC',              31, 'Bovino'],
  ['Strip Loin NC',                   1, 'Bovino'],
  ['Small Intestine Swift',           5, 'Miúdos'],
  ['Eye Round Macesa',                6, 'Bovino'],
  ['Short Rib Plate NC',            20,  'Bovino'],
  ['Prime Steak NC',                  6, 'Bovino'],
  ['Sirloin Roast Wholestone',        3, 'Bovino'],
  ['Back Ribs NC',                    7, 'Bovino'],
  ['Tenderloin 5uP',                15,  'Bovino'],
  ['Oxtail Whole Pradera',           6,  'Miúdos'],
  ['Chuck Roll Bone In Pradera',     1,  'Bovino'],
  ['Ribeye Pradera',                  8, 'Bovino'],
  ['Manteca Cap Lard',                2, 'Miúdos'],
  ['New York Steak NC',               2, 'Bovino'],
  ['Porterhouse NC',                 15, 'Bovino'],
  ['Pork Loin Boneless Smithfield',   1, 'Suíno'],
  ['Stewing Hens B&B',               5, 'Aves'],
  ['Baking Hens Tip Top',            5, 'Aves'],
  ['Beef Head H&B',                   5, 'Miúdos'],
  ['Pork Smoked Lee',                 8, 'Suíno'],
  ['Tripa para Tacos',                2, 'Miúdos'],
  ['Hind Shank Pradera',            18,  'Bovino'],
  ['Pectoral Creekstone',             1, 'Bovino'],
  ['Pork Stomach Daisyfield',        6,  'Suíno'],
  ['Boneless Beef Top Sirloin IBP',   1, 'Bovino'],
  ['Chuck Roll NC',                  36, 'Bovino'],
  ['Beef Puyazo Macesa',              5, 'Bovino'],
  ['Tenderloin 3/4 BR',             17,  'Bovino'],
  ['Chicken Drumsticks House of Raeford', 1, 'Aves'],
]

// ===================== CONTAINER 36 =====================
const CT36 = [
  ['Honey Comb Gico',               30, 'Miúdos'],
  ['Short Rib Plate NC',             5, 'Bovino'],
  ['Beef Tongue NC',                20,  'Miúdos'],
  ['Tostones Hawaiian',             28,  'Congelados'],
  ['Yuca Chunks',                   22,  'Congelados'],
  ['Batata Frita',                  22,  'Congelados'],
  ['Neck Bone Macesa',              43,  'Bovino'],
  ['Short Ribs IBP',                28,  'Bovino'],
  ['Flap Meat Uruguaio',            31, 'Bovino'],
  ['Picanha Gorina',                73,  'Bovino'],
  ['Tenderloin 3/4 BR',            293, 'Bovino'],
  ['Tenderloin 4/5 BR',              2, 'Bovino'],
  ['Tenderloin 5uP',                39,  'Bovino'],
]

// ===================== CONTAINER 33 =====================
const CT33 = [
  ['Beef Tripe IBP',                 7, 'Miúdos'],
  ['Sweet Plantain',                  3, 'Congelados'],
  ['Cheek Meat National',             2, 'Bovino'],
  ['Back Ribs NC',                   19, 'Bovino'],
  ['Tenderloin 4/5 Gorina',         11,  'Bovino'],
  ['Honey Comb Swift',              14,  'Miúdos'],
  ['Pork Hind Feet Seaboard',        6, 'Suíno'],
  ['Pork Skin Olymel',               8, 'Suíno'],
  ['Mofongo Balls',                  20, 'Congelados'],
  ['Tripa para Tacos Amigos',        7, 'Miúdos'],
  ['Tenderloin 3/4 Paraguaio',       3, 'Bovino'],
  ['Tenderloin 5uP',                  1, 'Bovino'],
  ['Turkey Neck Canada',              3, 'Aves'],
  ['Inside Round Gorina',           23,  'Bovino'],
  ['Turkey Wing Canada',              5, 'Aves'],
  ['Beef Livers IBP',                 2, 'Miúdos'],
  ['Small Intestine Swift',           9, 'Miúdos'],
  ['Beef Feet IBP',                   4, 'Miúdos'],
  ['Pork Ears Viandes',               5, 'Suíno'],
  ['Pork Tongue Swift',               3, 'Suíno'],
  ['Sweetbread Swift',                3, 'Miúdos'],
  ['Beef Tail Teys',                 10, 'Miúdos'],
  ['Beef Omasum',                     8, 'Miúdos'],
  ['Lip Unscalded Swift',             3, 'Miúdos'],
  ['Picanha Two Rivers',              5, 'Bovino'],
  ['Pork Loin Sem Marca',             7, 'Suíno'],
  ['Pork Tail Smithfield',            3, 'Suíno'],
  ['Pork Hock Long Farmland',         8, 'Suíno'],
  ['Beef Tongue Friboi',              1, 'Miúdos'],
  ['Pork Belly Sadia',              118, 'Suíno'],
  ['Knuckle Arrebeef',               75, 'Bovino'],
  ['Chicken Hearts Amick',            1, 'Aves'],
  ['Chicken Breast House of Raeford', 1, 'Aves'],
]

// ===================== CONTAINER 32 =====================
const CT32 = [
  ['Tenderloin 5uP',                 10, 'Bovino'],
  ['Tenderloin 4/5 BR',             10,  'Bovino'],
  ['Lifter Meat Macesa',              5, 'Bovino'],
  ['Strip Loin NC',                   5, 'Bovino'],
  ['Chuck Tender Macesa',            28, 'Bovino'],
  ['Chuck Roll NC',                  16, 'Bovino'],
  ['Picanha Two Rivers',             26, 'Bovino'],
  ['Tri Tip Macesa',                 14, 'Bovino'],
  ['Beef Sirloin Butt Macesa',       18, 'Bovino'],
  ['Back Ribs NC',                    1, 'Bovino'],
  ['Inside Round Macesa',            36, 'Bovino'],
  ['Beef Flat Bottom SM',            25, 'Bovino'],
  ['Chicken Heart Mountaire',        50, 'Aves'],
  ['Picanha Alberta 38',             91, 'Bovino'],
]

// ===================== CONTAINER 31 =====================
const CT31 = [
  ['Young Chicken Koch Foods',        2, 'Aves'],
  ['Tenderloin 4/5 BR',               2, 'Bovino'],
  ['Pork Ham Conestoga',               4, 'Suíno'],
  ['Knuckle Arrebeef',               26, 'Bovino'],
  ['Chicken Whole Fryers Koch',        4, 'Aves'],
  ['Flap Meat Greenham',             20, 'Bovino'],
  ['Chicken Tenders Emmaus Foods',     1, 'Aves'],
  ['Chicken Paws Case Farms',         2, 'Aves'],
  ['Cornish Hens',                     1, 'Aves'],
  ['Mutton Swift',                     1, 'Bovino'],
  ['Party Wings Koch',                 6, 'Aves'],
  ['Pork Hind Feet Smithfield',        2, 'Suíno'],
  ['Beef Head Iowa Beef',              2, 'Miúdos'],
  ['Thomas Lamb',                      3, 'Bovino'],
  ['Picanha Gorina',                  17, 'Bovino'],
  ['Boneless Skinless Koch',           8, 'Aves'],
  ['Chicken Hearts Amick',            5, 'Aves'],
  ['Brisket Macesa',                   3, 'Bovino'],
  ['Flap Meat 80',                    24, 'Bovino'],
  ['Chicken Gizzards Mountaire',       4, 'Aves'],
  ['1/4 Leg Country Post',            2, 'Aves'],
  ['Stewing Hens',                     2, 'Aves'],
  ['Turkey Necks',                     6, 'Aves'],
  ['Beef Feet Macesa',                47, 'Miúdos'],
  ['Chicken Drumsticks',              5, 'Aves'],
  ['Pork Salt Dry',                    4, 'Suíno'],
  ['Cheek Meat National',              1, 'Bovino'],
  ['Flap Meat Natural Flinders',      18, 'Bovino'],
  ['Frango Caipira',                  37, 'Aves'],
  ['Beef Feet IBP',                    1, 'Miúdos'],
  ['Yuca Fries',                      74, 'Congelados'],
  ['Sweet Plantain',                  76, 'Congelados'],
  ['Tenderloin 3/4 Paraguay com Fita', 1, 'Bovino'],
  ['Short Ribs American Foods',        3, 'Bovino'],
  ['Lava Cake',                        3, 'Congelados'],
  ['OR 27',                            2, 'Outros'],
  ['OR 15',                            1, 'Outros'],
  ['OR 27 S/P',                        1, 'Outros'],
  ['OR 18',                            2, 'Outros'],
  ['OR 52',                            1, 'Outros'],
  ['OR 28 Pimenta Biquinho',           1, 'Outros'],
]

// ===================== SECOS > NASSIF =====================
const SN = [
  ['Polvilho Azedo',                189, 'Secos'],
  ['Polvilho Doce',                 137, 'Secos'],
  ['Palmito Tolete',                 70, 'Secos'],
  ['Palmito Whole',                  78, 'Secos'],
]

// ===================== SECOS > SAAB =====================
const SS = [
  ['Polvilho Doce',                 411, 'Secos'],
  ['Polvilho Azedo',                436, 'Secos'],
  ['Palmito 500g',                  354, 'Secos'],
  ['Palmito Grande',                 53, 'Secos'],
]

// ===================== SECOS > BEBIDAS =====================
const SB = [
  ['Terra Brazilis',                551, 'Bebidas'],
  ['51 Gold',                       859, 'Bebidas'],
  ['51 Diver',                      104, 'Bebidas'],
  ['Garibaldi Glera',                31, 'Bebidas'],
  ['Mix',                           123, 'Bebidas'],
  ['Pérgola Sweet 750ml',           32,  'Bebidas'],
  ['Pérgola Bordo Demi Sec 750ml',   6, 'Bebidas'],
  ['Reserva Única',                  28, 'Bebidas'],
  ['Reserva Rara',                   26, 'Bebidas'],
  ['Reserva Singular',               36, 'Bebidas'],
  ['Keg Chop',                       17, 'Bebidas'],
  ['Suco de Uva',                    13, 'Bebidas'],
  ['Jambu',                          14, 'Bebidas'],
  ['Melt Rosé',                       7, 'Bebidas'],
  ['Tannat',                         19, 'Bebidas'],
  ['Garibaldi Moscatel',              5, 'Bebidas'],
  ['Garibaldi Chardonnay Brut',       5, 'Bebidas'],
  ['Garibaldi Espumante Pinot Noir', 14, 'Bebidas'],
  ['Bananinha',                       7, 'Bebidas'],
  ['Garibaldi VG Brut Rosé',         2, 'Bebidas'],
  ['Garibaldi Vero Demi Sec Rosé',    1, 'Bebidas'],
  ['Garibaldi Wine Chardonnay',       2, 'Bebidas'],
  ['Garibaldi Vero Demi Sec',         6, 'Bebidas'],
  ['Garibaldi VG Extra Brut',         3, 'Bebidas'],
  ['Vodka',                          47, 'Bebidas'],
  ['Império Ultra',                2769, 'Bebidas'],
  ['Império Gold',                 4169, 'Bebidas'],
  ['Império Lager',                3097, 'Bebidas'],
  ['Baly Green Apple',               77, 'Bebidas'],
  ['Baly Original Sugar Free',       70, 'Bebidas'],
  ['Baly Original',                 256, 'Bebidas'],
  ['Baly Tropical',                 244, 'Bebidas'],
]

// ===================== OPEN BOX =====================
const OB = [
  ['Vodka',                           1, 'Bebidas'],
  ['Pérgola 1 Litro',                 8, 'Bebidas'],
  ['51 Gold',                          5, 'Bebidas'],
  ['Pérgola Medium Dry',             10, 'Bebidas'],
  ['Pérgola Sweet',                   16, 'Bebidas'],  // 6 + 10
  ['Garibaldi Vero Demi Sec',          1, 'Bebidas'],
  ['Melt Rosé',                        2, 'Bebidas'],
  ['Melt Brut',                        6, 'Bebidas'],
  ['Garibaldi Extra Brut',             6, 'Bebidas'],
  ['Pérgola Dry Red Wine',             4, 'Bebidas'],
  ['Garibaldi Wine Chardonnay',       10, 'Bebidas'],
  ['Draft Wine',                      14, 'Bebidas'],
  ['Suco',                            10, 'Bebidas'],
  ['Garibaldi Glera',                 22, 'Bebidas'],
  ['Bananinha',                        1, 'Bebidas'],
  ['Terra Brazilis',                   1, 'Bebidas'],
  ['Garibaldi Moscatel',               9, 'Bebidas'],
  ['Garibaldi Vero Demi Sec Rosé',    10, 'Bebidas'],
  ['Garibaldi Vero Brut Rosé',        14, 'Bebidas'],
  ['51 Silver',                       39, 'Bebidas'],
  ['Cachaça Jambu',                    4, 'Bebidas'],
  ['Reserva Rara',                     1, 'Bebidas'],
  ['Mix Reserva',                      1, 'Bebidas'],
  ['Garibaldi Rosé Extra Brut',       10, 'Bebidas'],
  ['Império Lager',                   27, 'Bebidas'],
  ['Império Gold',                    13, 'Bebidas'],
  ['Garibaldi Tannat',                 5, 'Bebidas'],
]

/* ───────────────────────────────────────────────────────────────
 * CAPACIDADE — calcula o máximo de caixas por contêiner
 * ─────────────────────────────────────────────────────────────── */
function capacityForQty(qty) {
  if (qty <= 10)   return 100
  if (qty <= 100)  return 250
  if (qty <= 500)  return 850
  if (qty <= 1000) return 3000
  if (qty <= 2000) return 5000
  return 7000
}

/* ───────────────────────────────────────────────────────────────
 * ZONAS — associa cada grupo ao zone/subZone e prefixo de label
 * ─────────────────────────────────────────────────────────────── */
const ZONES = [
  { entries: CF,   zone: 'CAMARA_FRIA',      subZone: null,      prefix: 'CF'   },
  { entries: CFF,  zone: 'CAMARA_FRIA_FORA', subZone: null,      prefix: 'CFF'  },
  { entries: CT36, zone: 'CONTAINERS',       subZone: null,      prefix: 'CT36' },
  { entries: CT33, zone: 'CONTAINERS',       subZone: null,      prefix: 'CT33' },
  { entries: CT32, zone: 'CONTAINERS',       subZone: null,      prefix: 'CT32' },
  { entries: CT31, zone: 'CONTAINERS',       subZone: null,      prefix: 'CT31' },
  { entries: SN,   zone: 'SECOS',            subZone: 'NASSIF',  prefix: 'SN'   },
  { entries: SS,   zone: 'SECOS',            subZone: 'SAAB',    prefix: 'SS'   },
  { entries: SB,   zone: 'SECOS',            subZone: 'BEBIDAS', prefix: 'SB'   },
  { entries: OB,   zone: 'OPEN_BOX',         subZone: null,      prefix: 'OB'   },
]

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
  // ── Utilizadores ─────────────────────────────────────────────
  const users = [
    { email: 'admin@saab.com',      password: '123456',       role: 'ADMIN'     },
    { email: 'expedicao@saab.com',   password: 'expedicao123', role: 'EXPEDICAO' },
    { email: 'motorista@saab.com',   password: 'motorista123', role: 'MOTORISTA' },
    { email: 'frigorifico.norte@saab.com', password: '123456', role: 'CLIENTE'   },
    { email: 'distribuidora.sul@saab.com', password: '123456', role: 'CLIENTE'   },
    { email: 'supermercado.abc@saab.com',  password: '123456', role: 'CLIENTE'   },
  ]

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } })
    if (!exists) {
      const hashed = await bcrypt.hash(u.password, 12)
      await prisma.user.create({ data: { email: u.email, password: hashed, role: u.role } })
      console.log(`Utilizador criado: ${u.email}`)
    } else {
      console.log(`Utilizador já existe: ${u.email}`)
    }
  }

  // Actualiza coordenadas nos pedidos sem lat/lon
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

  // ── Produtos & Contêineres ───────────────────────────────────
  const existingProducts = await prisma.product.count()
  if (existingProducts > 0) {
    console.log('Produtos já existem. Para re-seed, apague a DB primeiro (docker compose down -v).')
    return
  }

  // 1) Extrair produtos únicos (por nome, case-insensitive)
  const productMap = new Map() // lowercase → { name, type }
  for (const z of ZONES) {
    for (const [name, , type] of z.entries) {
      const key = name.toLowerCase()
      if (!productMap.has(key)) {
        productMap.set(key, { name, type })
      }
    }
  }

  // 2) Criar todos os produtos
  const createdProducts = new Map() // lowercase → Product record
  for (const [key, { name, type }] of productMap) {
    const product = await prisma.product.create({
      data: { name, type, pricePerBox: 0 },
    })
    createdProducts.set(key, product)
  }
  console.log(`${createdProducts.size} produtos criados.`)

  // 3) Criar contêineres — um por entrada de inventário
  let containerCount = 0
  for (const z of ZONES) {
    let idx = 1
    for (const [name, qty] of z.entries) {
      const label = `${z.prefix}-${String(idx).padStart(2, '0')}`
      const product = createdProducts.get(name.toLowerCase())
      await prisma.container.create({
        data: {
          label,
          zone:      z.zone,
          subZone:   z.subZone ?? null,
          capacity:  capacityForQty(qty),
          quantity:  qty,
          productId: product.id,
        },
      })
      idx++
      containerCount++
    }
  }
  console.log(`${containerCount} contêineres criados.`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
