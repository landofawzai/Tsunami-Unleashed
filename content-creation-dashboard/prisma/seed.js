// Seed data for Content Creation Dashboard
// Creates realistic sample data across all 12 models

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function cuid() {
  return 'c' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4)
}

async function main() {
  console.log('Seeding Content Creation database...')

  // ── SERIES ──
  const series1Id = cuid()
  const series2Id = cuid()

  const seriesList = [
    {
      id: series1Id,
      title: 'Romans Deep Dive',
      description: 'A comprehensive teaching series through the book of Romans, covering chapters 1-16 over 12 weeks.',
      contentType: 'sermon',
      totalPlanned: 12,
      status: 'active',
      tags: JSON.stringify(['romans', 'deep-dive', 'epistle', 'pauline']),
    },
    {
      id: series2Id,
      title: 'Spiritual Disciplines for Daily Life',
      description: 'Practical teaching series on prayer, fasting, study, and worship for everyday believers.',
      contentType: 'teaching',
      totalPlanned: 6,
      status: 'active',
      tags: JSON.stringify(['spiritual-disciplines', 'prayer', 'fasting', 'practical']),
    },
  ]

  for (const series of seriesList) {
    await prisma.series.create({ data: series })
  }
  console.log(`  ✓ ${seriesList.length} series`)

  // ── CONTENT ITEMS ──
  const item1Id = cuid()
  const item2Id = cuid()
  const item3Id = cuid()
  const item4Id = cuid()
  const item5Id = cuid()
  const item6Id = cuid()

  const now = new Date()
  const items = [
    {
      id: item1Id,
      contentId: 'SRC-20260210-a1b2c3',
      title: 'Romans 8: Life in the Spirit',
      description: 'Sunday sermon on Romans 8:1-17. The foundation of freedom — no condemnation in Christ Jesus.',
      contentType: 'sermon',
      mediaType: 'video',
      language: 'en',
      body: null,
      wordCount: 6300,
      durationSeconds: 2520,
      sourceUrl: null,
      driveFileId: 'gdrive-001-romans8',
      seriesId: series1Id,
      status: 'sent_to_repurposing',
      priority: 1,
      assignedTo: 'Pastor James',
      tags: JSON.stringify(['romans-8', 'holy-spirit', 'freedom', 'no-condemnation']),
      targetLanguages: JSON.stringify(['hi', 'bn', 'mai']),
      metadata: JSON.stringify({
        contentId: 'SRC-20260210-a1b2c3',
        title: 'Romans 8: Life in the Spirit',
        contentType: 'sermon',
        language: 'en',
        createdBy: 'content_creation',
        flags: { readyForRepurposing: true, readyForTranslation: true, readyForDistribution: false },
      }),
      sentToRepurposing: true,
      sentAt: new Date('2026-02-12'),
      plannedDate: new Date('2026-02-10'),
    },
    {
      id: item2Id,
      contentId: 'SRC-20260213-d4e5f6',
      title: 'The Practice of Persistent Prayer',
      description: 'Weekly teaching on Luke 18 — the persistent widow and what Jesus taught about never giving up in prayer.',
      contentType: 'teaching',
      mediaType: 'audio',
      language: 'en',
      body: null,
      wordCount: 4500,
      durationSeconds: 1800,
      sourceUrl: null,
      driveFileId: 'gdrive-002-prayer',
      seriesId: series2Id,
      status: 'finalized',
      priority: 2,
      assignedTo: 'Pastor James',
      tags: JSON.stringify(['prayer', 'persistence', 'luke-18', 'spiritual-disciplines']),
      targetLanguages: JSON.stringify(['hi', 'bn', 'mai']),
      metadata: null,
      sentToRepurposing: false,
      sentAt: null,
      plannedDate: new Date('2026-02-13'),
    },
    {
      id: item3Id,
      contentId: 'SRC-20260215-g7h8i9',
      title: 'Standing Firm: Encouragement for Believers Under Persecution',
      description: 'Written article for believers facing persecution. Biblical encouragement from Matthew 5 and 1 Peter.',
      contentType: 'article',
      mediaType: 'text',
      language: 'en',
      body: 'Brothers and sisters around the world are facing increasing pressure for their faith. In many nations, simply gathering to worship or sharing the Gospel carries real risk. Yet Scripture is clear: "Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven" (Matthew 5:10).\n\nThe early church understood this reality intimately. When persecution scattered believers from Jerusalem, they went everywhere preaching the word (Acts 8:4). Persecution didn\'t destroy the church — it multiplied it.\n\nToday, the same pattern holds. In restricted nations, the underground church is growing faster than anywhere else on earth. Why? Because when everything else is stripped away, the gospel shines brightest.\n\nIf you are facing pressure today — whether from family, government, or culture — know this: you are not alone. The global body of Christ stands with you. And more importantly, Christ Himself stands with you. "I will never leave you nor forsake you" (Hebrews 13:5).',
      wordCount: 2800,
      durationSeconds: null,
      sourceUrl: null,
      driveFileId: 'gdrive-003-persecution',
      seriesId: null,
      status: 'approved',
      priority: 1,
      assignedTo: 'Sister Mary',
      tags: JSON.stringify(['persecution', 'encouragement', 'faith', 'matthew-5', '1-peter']),
      targetLanguages: JSON.stringify(['hi', 'bn', 'mai', 'ur', 'ta']),
      metadata: null,
      sentToRepurposing: false,
      sentAt: null,
      plannedDate: new Date('2026-02-15'),
    },
    {
      id: item4Id,
      contentId: 'SRC-20260217-j1k2l3',
      title: 'Romans 9: God\'s Sovereign Choice',
      description: 'Next sermon in the Romans Deep Dive series. Covers election, mercy, and God\'s sovereign purposes.',
      contentType: 'sermon',
      mediaType: 'video',
      language: 'en',
      body: null,
      wordCount: null,
      durationSeconds: null,
      sourceUrl: null,
      driveFileId: null,
      seriesId: series1Id,
      status: 'recording',
      priority: 2,
      assignedTo: 'Pastor James',
      tags: JSON.stringify(['romans-9', 'sovereignty', 'election', 'mercy']),
      targetLanguages: JSON.stringify(['hi', 'bn', 'mai']),
      metadata: null,
      sentToRepurposing: false,
      sentAt: null,
      plannedDate: new Date('2026-02-17'),
    },
    {
      id: item5Id,
      contentId: 'SRC-20260220-m4n5o6',
      title: 'The Discipline of Fasting',
      description: 'Teaching on biblical fasting — why, how, and what to expect. Includes practical guide for beginners.',
      contentType: 'teaching',
      mediaType: 'audio',
      language: 'en',
      body: null,
      wordCount: null,
      durationSeconds: null,
      sourceUrl: null,
      driveFileId: null,
      seriesId: series2Id,
      status: 'drafting',
      priority: 3,
      assignedTo: 'Pastor James',
      tags: JSON.stringify(['fasting', 'spiritual-disciplines', 'practical']),
      targetLanguages: JSON.stringify(['hi', 'bn', 'mai']),
      metadata: null,
      sentToRepurposing: false,
      sentAt: null,
      plannedDate: new Date('2026-02-20'),
    },
    {
      id: item6Id,
      contentId: 'SRC-20260225-p7q8r9',
      title: 'Household Discipleship: A Study Guide for Families',
      description: 'Study guide for families to use together. Covers Deuteronomy 6 and the household model of faith.',
      contentType: 'study_guide',
      mediaType: 'text',
      language: 'en',
      body: null,
      wordCount: null,
      durationSeconds: null,
      sourceUrl: null,
      driveFileId: null,
      seriesId: null,
      status: 'planning',
      priority: 4,
      assignedTo: 'Sister Mary',
      tags: JSON.stringify(['discipleship', 'family', 'deuteronomy-6', 'household']),
      targetLanguages: JSON.stringify(['hi', 'bn']),
      metadata: null,
      sentToRepurposing: false,
      sentAt: null,
      plannedDate: new Date('2026-02-25'),
    },
  ]

  for (const item of items) {
    await prisma.contentItem.upsert({
      where: { contentId: item.contentId },
      update: {},
      create: item,
    })
  }
  console.log(`  ✓ ${items.length} content items`)

  // ── CONTENT BRIEFS ──
  const briefs = [
    {
      id: cuid(),
      contentItemId: item1Id,
      outline: '1. Introduction: The great declaration (v1)\n2. Life in the flesh vs. life in the Spirit (v2-8)\n3. The indwelling Spirit (v9-11)\n4. Children and heirs of God (v12-17)\n5. Application: Walking by the Spirit this week',
      keyPoints: JSON.stringify(['No condemnation in Christ', 'Spirit vs flesh contrast', 'Adoption as children', 'Co-heirs with Christ']),
      targetAudience: 'Sunday congregation — mixed maturity levels',
      estimatedDuration: 42,
      estimatedWordCount: 6000,
      scriptureReferences: JSON.stringify(['Romans 8:1-17', 'Galatians 5:16-25', 'John 14:16-17']),
      notes: 'Include personal testimony about freedom from condemnation. Use illustration of adoption papers.',
    },
    {
      id: cuid(),
      contentItemId: item4Id,
      outline: '1. Context: Paul\'s anguish for Israel (v1-5)\n2. Not all Israel is Israel (v6-13)\n3. God\'s mercy and justice (v14-18)\n4. The potter and the clay (v19-24)\n5. Application: Trusting God\'s sovereign plan',
      keyPoints: JSON.stringify(['God\'s promises haven\'t failed', 'Election is God\'s prerogative', 'Mercy over merit', 'Human responsibility remains']),
      targetAudience: 'Sunday congregation — need careful handling of election topic',
      estimatedDuration: 45,
      estimatedWordCount: 7000,
      scriptureReferences: JSON.stringify(['Romans 9:1-24', 'Exodus 33:19', 'Isaiah 29:16']),
      notes: 'Sensitive topic — emphasize God\'s goodness and mercy throughout. Avoid calvinist/arminian debate.',
    },
    {
      id: cuid(),
      contentItemId: item5Id,
      outline: '1. What is biblical fasting? (definition and types)\n2. Why fast? (biblical reasons)\n3. How to fast safely (practical guide)\n4. What to expect during a fast\n5. Breaking a fast properly',
      keyPoints: JSON.stringify(['Fasting is about focus, not merit', 'Start small — skip one meal', 'Always drink water', 'Replace eating time with prayer']),
      targetAudience: 'Believers new to spiritual disciplines',
      estimatedDuration: 30,
      estimatedWordCount: 4500,
      scriptureReferences: JSON.stringify(['Matthew 6:16-18', 'Isaiah 58:1-12', 'Acts 13:2-3']),
      notes: 'Include medical disclaimer. Emphasize that fasting is voluntary, not mandatory.',
    },
    {
      id: cuid(),
      contentItemId: item6Id,
      outline: '1. The Shema: God\'s command to parents (Deut 6:4-9)\n2. The household model in Scripture\n3. Discussion questions for families\n4. Weekly devotional activities\n5. Prayer guide for families',
      keyPoints: JSON.stringify(['Faith is caught and taught at home', 'Simple daily rhythms matter most', 'Include all ages in conversation']),
      targetAudience: 'Families with children of all ages',
      estimatedDuration: null,
      estimatedWordCount: 3500,
      scriptureReferences: JSON.stringify(['Deuteronomy 6:4-9', 'Psalm 78:1-8', 'Ephesians 6:4']),
      notes: 'Design for translation into Hindi and Bengali. Keep cultural references adaptable.',
    },
  ]

  for (const brief of briefs) {
    await prisma.contentBrief.create({ data: brief })
  }
  console.log(`  ✓ ${briefs.length} content briefs`)

  // ── REVIEW RECORDS ──
  const reviews = [
    {
      id: cuid(), contentItemId: item1Id, reviewerName: 'Elder Thomas',
      status: 'approved', feedback: 'Excellent exposition of Romans 8. Clear application. Ready for distribution.',
      theologicalAccuracy: 5, clarity: 5, productionQuality: 4,
    },
    {
      id: cuid(), contentItemId: item1Id, reviewerName: 'Sister Ruth',
      status: 'approved', feedback: 'Very encouraging message. Congregation responded well. Audio quality could be slightly better.',
      theologicalAccuracy: 5, clarity: 4, productionQuality: 3,
    },
    {
      id: cuid(), contentItemId: item2Id, reviewerName: 'Elder Thomas',
      status: 'approved', feedback: 'Solid teaching on prayer. Good use of Luke 18.',
      theologicalAccuracy: 5, clarity: 5, productionQuality: 5,
    },
    {
      id: cuid(), contentItemId: item3Id, reviewerName: 'Elder Thomas',
      status: 'approved', feedback: 'Timely and sensitive article. Theology is sound. Ready for finalization.',
      theologicalAccuracy: 5, clarity: 5, productionQuality: 5,
    },
    {
      id: cuid(), contentItemId: item3Id, reviewerName: 'Brother Arun',
      status: 'approved', feedback: 'Very relevant for our South Asian context. Reviewed from a local perspective — the encouragement is exactly what believers there need.',
      theologicalAccuracy: 5, clarity: 5, productionQuality: 4,
    },
    {
      id: cuid(), contentItemId: item2Id, reviewerName: 'Sister Ruth',
      status: 'revision_requested', feedback: 'Could add more practical steps for beginners. The biblical foundation is strong but application could be more specific.',
      theologicalAccuracy: 5, clarity: 3, productionQuality: 4,
    },
    {
      id: cuid(), contentItemId: item2Id, reviewerName: 'Sister Ruth',
      status: 'approved', feedback: 'Revisions made. Much better practical guidance now. Approved.',
      theologicalAccuracy: 5, clarity: 5, productionQuality: 4,
    },
    {
      id: cuid(), contentItemId: item3Id, reviewerName: 'Sister Mary',
      status: 'approved', feedback: 'Self-review complete. Checked Scripture references and tone.',
      theologicalAccuracy: 5, clarity: 5, productionQuality: 5,
    },
  ]

  for (const review of reviews) {
    await prisma.reviewRecord.create({ data: review })
  }
  console.log(`  ✓ ${reviews.length} review records`)

  // ── PRODUCTION TASKS ──
  const tasks = [
    // Romans 8 sermon tasks (all completed)
    { id: cuid(), contentItemId: item1Id, title: 'Write sermon outline', assignedTo: 'Pastor James', status: 'completed', sortOrder: 1, completedAt: new Date('2026-02-08') },
    { id: cuid(), contentItemId: item1Id, title: 'Record sermon video', assignedTo: 'AV Team', status: 'completed', sortOrder: 2, completedAt: new Date('2026-02-10') },
    { id: cuid(), contentItemId: item1Id, title: 'Edit video and audio', assignedTo: 'AV Team', status: 'completed', sortOrder: 3, completedAt: new Date('2026-02-11') },
    { id: cuid(), contentItemId: item1Id, title: 'Upload to Google Drive', assignedTo: 'AV Team', status: 'completed', sortOrder: 4, completedAt: new Date('2026-02-11') },

    // Prayer teaching tasks (mostly completed)
    { id: cuid(), contentItemId: item2Id, title: 'Prepare teaching notes', assignedTo: 'Pastor James', status: 'completed', sortOrder: 1, completedAt: new Date('2026-02-12') },
    { id: cuid(), contentItemId: item2Id, title: 'Record audio', assignedTo: 'Pastor James', status: 'completed', sortOrder: 2, completedAt: new Date('2026-02-13') },
    { id: cuid(), contentItemId: item2Id, title: 'Upload to Google Drive', assignedTo: 'AV Team', status: 'completed', sortOrder: 3, completedAt: new Date('2026-02-14') },

    // Persecution article tasks
    { id: cuid(), contentItemId: item3Id, title: 'Draft article', assignedTo: 'Sister Mary', status: 'completed', sortOrder: 1, completedAt: new Date('2026-02-14') },
    { id: cuid(), contentItemId: item3Id, title: 'Submit for review', assignedTo: 'Sister Mary', status: 'completed', sortOrder: 2, completedAt: new Date('2026-02-15') },

    // Romans 9 tasks (in progress)
    { id: cuid(), contentItemId: item4Id, title: 'Research and outline', assignedTo: 'Pastor James', status: 'completed', sortOrder: 1, completedAt: new Date('2026-02-16') },
    { id: cuid(), contentItemId: item4Id, title: 'Record sermon', assignedTo: 'AV Team', status: 'in_progress', sortOrder: 2, dueDate: new Date('2026-02-17') },
    { id: cuid(), contentItemId: item4Id, title: 'Edit and finalize', assignedTo: 'AV Team', status: 'pending', sortOrder: 3, dueDate: new Date('2026-02-18') },
  ]

  for (const task of tasks) {
    await prisma.productionTask.create({ data: task })
  }
  console.log(`  ✓ ${tasks.length} production tasks`)

  // ── CONTENT FILES ──
  const files = [
    { id: cuid(), contentItemId: item1Id, fileName: '2026-02-10_Romans8_Sermon_v1.mp4', fileType: 'video', mimeType: 'video/mp4', fileSize: 524288000, driveFileId: 'gdrive-001-romans8', driveUrl: 'https://drive.google.com/file/d/gdrive-001-romans8', isPrimary: true },
    { id: cuid(), contentItemId: item1Id, fileName: '2026-02-10_Romans8_Sermon_v1.mp3', fileType: 'audio', mimeType: 'audio/mpeg', fileSize: 41943040, driveFileId: 'gdrive-001a-romans8-audio', isPrimary: false },
    { id: cuid(), contentItemId: item2Id, fileName: '2026-02-13_PersistentPrayer_Teaching_v1.mp3', fileType: 'audio', mimeType: 'audio/mpeg', fileSize: 31457280, driveFileId: 'gdrive-002-prayer', driveUrl: 'https://drive.google.com/file/d/gdrive-002-prayer', isPrimary: true },
    { id: cuid(), contentItemId: item3Id, fileName: '2026-02-15_StandingFirm_Article_v2.docx', fileType: 'document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 45056, driveFileId: 'gdrive-003-persecution', isPrimary: true },
    { id: cuid(), contentItemId: item3Id, fileName: '2026-02-15_StandingFirm_HeaderImage.jpg', fileType: 'image', mimeType: 'image/jpeg', fileSize: 204800, driveFileId: 'gdrive-003a-persecution-img', isPrimary: false },
    { id: cuid(), contentItemId: item1Id, fileName: '2026-02-08_Romans8_Outline.docx', fileType: 'document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 28672, isPrimary: false },
  ]

  for (const file of files) {
    await prisma.contentFile.create({ data: file })
  }
  console.log(`  ✓ ${files.length} content files`)

  // ── CONTENT TAGS ──
  const tags = [
    { id: cuid(), name: 'romans', category: 'book', usageCount: 2 },
    { id: cuid(), name: 'prayer', category: 'topic', usageCount: 1 },
    { id: cuid(), name: 'persecution', category: 'topic', usageCount: 1 },
    { id: cuid(), name: 'holy-spirit', category: 'topic', usageCount: 1 },
    { id: cuid(), name: 'discipleship', category: 'topic', usageCount: 1 },
    { id: cuid(), name: 'sunday-sermon', category: 'audience', usageCount: 2 },
    { id: cuid(), name: 'spiritual-disciplines', category: 'topic', usageCount: 2 },
    { id: cuid(), name: 'fasting', category: 'topic', usageCount: 1 },
    { id: cuid(), name: 'family', category: 'audience', usageCount: 1 },
    { id: cuid(), name: 'encouragement', category: 'topic', usageCount: 1 },
  ]

  for (const tag of tags) {
    await prisma.contentTag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    })
  }
  console.log(`  ✓ ${tags.length} content tags`)

  // ── CALENDAR ENTRIES ──
  const calendarEntries = [
    { id: cuid(), contentItemId: item4Id, title: 'Romans 9 Sermon — Recording Day', entryType: 'deadline', date: new Date('2026-02-17'), isCompleted: false },
    { id: cuid(), contentItemId: item5Id, title: 'Fasting Teaching — Draft Due', entryType: 'deadline', date: new Date('2026-02-19'), isCompleted: false },
    { id: cuid(), contentItemId: item6Id, title: 'Household Discipleship Guide — Publish Date', entryType: 'publish_date', date: new Date('2026-02-25'), isCompleted: false },
  ]

  for (const entry of calendarEntries) {
    await prisma.calendarEntry.create({ data: entry })
  }
  console.log(`  ✓ ${calendarEntries.length} calendar entries`)

  // ── ALERTS ──
  const alerts = [
    {
      id: cuid(), severity: 'info', category: 'integration_error',
      message: 'Romans 8 sermon successfully sent to Repurposing Dashboard',
      details: JSON.stringify({ contentId: 'SRC-20260210-a1b2c3', sentAt: '2026-02-12' }),
      isRead: true, isResolved: true, resolvedAt: new Date('2026-02-12'),
    },
    {
      id: cuid(), severity: 'warning', category: 'review_overdue',
      message: 'Persecution article has been in review for 2 days — consider following up',
      details: JSON.stringify({ contentId: 'SRC-20260215-g7h8i9', reviewStarted: '2026-02-15' }),
      isRead: false, isResolved: false,
    },
  ]

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert })
  }
  console.log(`  ✓ ${alerts.length} alerts`)

  // ── METRICS ──
  const metrics = [
    {
      id: cuid(), date: new Date('2026-02-15'),
      contentPlanned: 2, contentDrafted: 1, contentFinalized: 1, contentSent: 1,
      reviewsCompleted: 3, tasksCompleted: 7,
      typeBreakdown: JSON.stringify({ sermon: 1, teaching: 0, article: 1, study_guide: 0 }),
      statusBreakdown: JSON.stringify({ planning: 1, drafting: 1, finalized: 1, sent_to_repurposing: 1 }),
    },
    {
      id: cuid(), date: new Date('2026-02-16'),
      contentPlanned: 1, contentDrafted: 1, contentFinalized: 1, contentSent: 0,
      reviewsCompleted: 2, tasksCompleted: 3,
      typeBreakdown: JSON.stringify({ sermon: 1, teaching: 1, article: 0, study_guide: 0 }),
      statusBreakdown: JSON.stringify({ recording: 1, drafting: 1, approved: 1 }),
    },
  ]

  for (const metric of metrics) {
    await prisma.creationMetric.upsert({
      where: { date: metric.date },
      update: {},
      create: metric,
    })
  }
  console.log(`  ✓ ${metrics.length} daily metrics`)

  // ── PABBLY EVENTS ──
  const events = [
    {
      id: cuid(), direction: 'outbound', workflowName: 'ROUTE-ContentCreation-to-Repurposing',
      eventType: 'content_sent', status: 'sent',
      payload: JSON.stringify({ contentId: 'SRC-20260210-a1b2c3', title: 'Romans 8: Life in the Spirit', contentType: 'sermon', mediaType: 'video' }),
      relatedContentId: 'SRC-20260210-a1b2c3',
    },
    {
      id: cuid(), direction: 'inbound', workflowName: 'ROUTE-Drive-to-ContentCreation',
      eventType: 'file_detected', status: 'received',
      payload: JSON.stringify({ driveFileId: 'gdrive-003-persecution', fileName: 'StandingFirm_Article_v2.docx' }),
      relatedContentId: 'SRC-20260215-g7h8i9',
    },
  ]

  for (const event of events) {
    await prisma.pabblyEvent.create({ data: event })
  }
  console.log(`  ✓ ${events.length} Pabbly events`)

  // ── SYSTEM SETTINGS ──
  const settings = [
    { key: 'default_target_languages', value: JSON.stringify(['hi', 'bn', 'mai']), description: 'Default target languages for new content' },
    { key: 'auto_send_to_repurposing', value: 'false', description: 'Automatically send finalized content to Repurposing' },
    { key: 'require_review_before_finalize', value: 'true', description: 'Require at least one approved review before finalizing' },
    { key: 'default_content_type', value: 'sermon', description: 'Default content type for new items' },
    { key: 'file_naming_convention', value: '[Date]_[Project]_[Type]_[Version].[ext]', description: 'File naming convention' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { id: cuid(), ...setting },
    })
  }
  console.log(`  ✓ ${settings.length} system settings`)

  console.log('\nSeed complete!')
  console.log('  Series: 2 (Romans Deep Dive, Spiritual Disciplines)')
  console.log('  Content Items: 6 (across all statuses and types)')
  console.log('  Briefs: 4, Reviews: 8, Tasks: 12, Files: 6')
  console.log('  Tags: 10, Calendar: 3, Alerts: 2, Metrics: 2')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
