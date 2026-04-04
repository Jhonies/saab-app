const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()
const data = JSON.parse(fs.readFileSync('./prisma/seed_data.json', 'utf8'))

async function run() {
  let updated = 0
  for (let item of data) {
    if (item.unit === 'unidade' || item.unit === 'unidades') {
      const dbContainers = await prisma.container.findMany({
        where: {
          product: { name: item.name.toLowerCase() }
        }
      })
      for (let dbC of dbContainers) {
        await prisma.container.update({
          where: { id: dbC.id },
          data: { unit: 'unidades' }
        })
        updated++
      }
    }
  }
  console.log('Updated ' + updated + ' containers to unidades soltas')
}

run().catch(console.error).finally(() => prisma.$disconnect())
