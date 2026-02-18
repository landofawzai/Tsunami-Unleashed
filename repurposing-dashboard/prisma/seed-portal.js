// Seed script for Translator Portal — creates admin user and portal setting
// Run: node prisma/seed-portal.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding translator portal...')

  // 1. Create default admin user
  const existingAdmin = await prisma.translatorUser.findUnique({
    where: { username: 'admin' },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('tsunami-admin-2026', 10)
    const admin = await prisma.translatorUser.create({
      data: {
        username: 'admin',
        passwordHash,
        displayName: 'Portal Admin',
        role: 'admin',
        languages: JSON.stringify(['hi', 'bn', 'mai']),
      },
    })
    console.log(`Created admin user: ${admin.username} (id: ${admin.id})`)
  } else {
    console.log('Admin user already exists')
  }

  // 2. Create portal open/closed setting
  const existingSetting = await prisma.systemSetting.findUnique({
    where: { key: 'translation_portal_open' },
  })

  if (!existingSetting) {
    await prisma.systemSetting.create({
      data: {
        key: 'translation_portal_open',
        value: 'true',
        description: 'Allow anonymous translation edits (set to false to require login)',
      },
    })
    console.log('Created translation_portal_open setting (default: true)')
  } else {
    console.log('translation_portal_open setting already exists')
  }

  console.log('Portal seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
