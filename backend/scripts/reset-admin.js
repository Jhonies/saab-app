/**
 * Reset / cria o utilizador ADMIN sem deixar credenciais no código.
 *
 * Uso (PowerShell):
 *   $env:ADMIN_EMAIL="admin@saab.com"; $env:ADMIN_PASSWORD="novaSenha"; node scripts/reset-admin.js
 *
 * Uso (bash):
 *   ADMIN_EMAIL=admin@saab.com ADMIN_PASSWORD=novaSenha node scripts/reset-admin.js
 *
 * Uso (CLI args):
 *   node scripts/reset-admin.js admin@saab.com novaSenha
 *
 * Requer DATABASE_URL no ambiente (mesma do backend).
 */

const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2]
  const password = process.env.ADMIN_PASSWORD || process.argv[3]

  if (!email || !password) {
    console.error('Falta email ou password.')
    console.error('Define ADMIN_EMAIL e ADMIN_PASSWORD ou passa como args:')
    console.error('  node scripts/reset-admin.js <email> <password>')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('Password tem de ter pelo menos 6 caracteres.')
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashed, role: 'ADMIN' },
    })
    console.log(`Password atualizada para ${email} (role ADMIN).`)
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: 'ADMIN',
        name: 'Admin',
        address: '',
      },
    })
    console.log(`Utilizador ADMIN criado: ${email}`)
  }
}

main()
  .catch((err) => {
    console.error('Erro:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
