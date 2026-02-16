// Database Seed Script for Distribution Dashboard
// Populates initial tier capacities and sample data

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌊 Seeding Tsunami Unleashed Distribution Dashboard...')

  // 1. Initialize Tier Capacities
  console.log('📊 Creating tier capacities...')

  const tier1 = await prisma.tierCapacity.upsert({
    where: { tier: 1 },
    update: {},
    create: {
      tier: 1,
      totalSlots: 150,
      usedSlots: 0,
      reservedSlots: 50, // Reserved for emerging languages
      availableSlots: 100, // 150 - 0 - 50
    },
  })

  const tier2 = await prisma.tierCapacity.upsert({
    where: { tier: 2 },
    update: {},
    create: {
      tier: 2,
      totalSlots: -1, // Unlimited
      usedSlots: 0,
      reservedSlots: 0,
      availableSlots: -1, // Unlimited
    },
  })

  const tier3 = await prisma.tierCapacity.upsert({
    where: { tier: 3 },
    update: {},
    create: {
      tier: 3,
      totalSlots: -1, // Unlimited
      usedSlots: 0,
      reservedSlots: 0,
      availableSlots: -1, // Unlimited
    },
  })

  console.log(`✅ Tier 1: ${tier1.totalSlots} slots (${tier1.reservedSlots} reserved)`)
  console.log(`✅ Tier 2: Unlimited`)
  console.log(`✅ Tier 3: Unlimited`)

  // 2. Create sample RSS feeds for Tier 1 & 2
  console.log('\n📡 Creating sample RSS feeds...')

  await prisma.rssFeed.upsert({
    where: { feedUrl: 'https://rssground.com/tsunami-unleashed/main-english' },
    update: {},
    create: {
      feedUrl: 'https://rssground.com/tsunami-unleashed/main-english',
      feedName: 'Main English Feed',
      tier: 1,
      language: 'en',
      subscriberCount: 0,
      managementTool: 'RSSground',
      isActive: true,
    },
  })

  await prisma.rssFeed.upsert({
    where: { feedUrl: 'https://ghost.tsunamiunleashed.org/rss' },
    update: {},
    create: {
      feedUrl: 'https://ghost.tsunamiunleashed.org/rss',
      feedName: 'External English Feed',
      tier: 2,
      language: 'en',
      subscriberCount: 0,
      managementTool: 'Ghost',
      isActive: true,
    },
  })

  console.log('✅ Sample RSS feeds created')

  // 3. Create sample platform health entries
  console.log('\n💚 Creating platform health entries...')

  const platforms = [
    { platform: 'RSS-English', tier: 1, managementTool: 'RSSground' },
    { platform: 'Ghost-Blog', tier: 2, managementTool: 'Ghost' },
    { platform: 'YouTube', tier: 3, managementTool: 'Followr' },
    { platform: 'Facebook', tier: 3, managementTool: 'Followr' },
    { platform: 'Instagram', tier: 3, managementTool: 'Followr' },
    { platform: 'Twitter', tier: 3, managementTool: 'Followr' },
    { platform: 'LinkedIn', tier: 3, managementTool: 'Followr' },
    { platform: 'Rumble', tier: 3, managementTool: 'Robomotion' },
  ]

  for (const p of platforms) {
    await prisma.platformHealth.upsert({
      where: { platform: p.platform },
      update: {},
      create: {
        platform: p.platform,
        tier: p.tier,
        status: 'healthy',
        managementTool: p.managementTool,
        failureCount24h: 0,
      },
    })
  }

  console.log('✅ Platform health entries created')

  // 4. Create initial pipeline metric for today
  console.log('\n📈 Creating initial pipeline metric...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.pipelineMetric.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      tier1Posts: 0,
      tier2Posts: 0,
      tier3Posts: 0,
      totalPosts: 0,
      successfulPosts: 0,
      failedPosts: 0,
      successRate: 0.0,
    },
  })

  console.log('✅ Today\'s pipeline metric initialized')

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
