// Communication Dashboard - Database Seed
// Populates with realistic global contacts, segments, campaigns, sequences

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Communication Dashboard...')

  // ── SEGMENTS ──
  const segments = await Promise.all([
    prisma.segment.create({
      data: { name: 'field_leaders', description: 'On-the-ground ministry workers and church planters', color: '#2563eb', contactCount: 0 },
    }),
    prisma.segment.create({
      data: { name: 'supporters', description: 'Prayer partners, financial supporters, and sending churches', color: '#10b981', contactCount: 0 },
    }),
    prisma.segment.create({
      data: { name: 'seekers', description: 'People who have engaged with content but are not yet connected locally', color: '#f59e0b', contactCount: 0 },
    }),
    prisma.segment.create({
      data: { name: 'prayer_partners', description: 'Dedicated intercessors who receive prayer request broadcasts', color: '#8b5cf6', contactCount: 0 },
    }),
    prisma.segment.create({
      data: { name: 'translators', description: 'Volunteer and paid translators working on content localization', color: '#f97316', contactCount: 0 },
    }),
  ])

  const [fieldLeaders, supporters, seekers, prayerPartners, translators] = segments
  console.log(`  Created ${segments.length} segments`)

  // ── CONTACTS (40+ across 10+ regions) ──
  const contacts = await Promise.all([
    // North America - USA
    prisma.contact.create({ data: { name: 'David Thompson', email: 'david.t@example.com', phone: '+12125551001', whatsapp: '+12125551001', region: 'North America', city: 'New York', country: 'US', language: 'en', timezone: 'America/New_York' } }),
    prisma.contact.create({ data: { name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+13105551002', whatsapp: '+13105551002', telegram: '@sarahm', region: 'North America', city: 'Los Angeles', country: 'US', language: 'en', timezone: 'America/Los_Angeles' } }),
    prisma.contact.create({ data: { name: 'Marcus Johnson', email: 'marcus.j@example.com', phone: '+17135551003', region: 'North America', city: 'Houston', country: 'US', language: 'en', timezone: 'America/Chicago' } }),
    prisma.contact.create({ data: { name: 'Maria Garcia', email: 'maria.g@example.com', phone: '+13055551004', whatsapp: '+13055551004', region: 'North America', city: 'Miami', country: 'US', language: 'es', timezone: 'America/New_York' } }),
    // North America - Canada
    prisma.contact.create({ data: { name: 'James Wilson', email: 'james.w@example.com', phone: '+14165551005', region: 'North America', city: 'Toronto', country: 'CA', language: 'en', timezone: 'America/Toronto' } }),

    // Europe
    prisma.contact.create({ data: { name: 'Emma Clarke', email: 'emma.c@example.com', phone: '+442075551006', whatsapp: '+442075551006', telegram: '@emmac', region: 'Europe', city: 'London', country: 'GB', language: 'en', timezone: 'Europe/London' } }),
    prisma.contact.create({ data: { name: 'Hans Mueller', email: 'hans.m@example.com', phone: '+49305551007', whatsapp: '+49305551007', region: 'Europe', city: 'Berlin', country: 'DE', language: 'de', timezone: 'Europe/Berlin' } }),
    prisma.contact.create({ data: { name: 'Sophie Dupont', email: 'sophie.d@example.com', phone: '+33155551008', whatsapp: '+33155551008', region: 'Europe', city: 'Paris', country: 'FR', language: 'fr', timezone: 'Europe/Paris' } }),
    prisma.contact.create({ data: { name: 'Jan de Vries', email: 'jan.dv@example.com', phone: '+31205551009', telegram: '@jandv', region: 'Europe', city: 'Amsterdam', country: 'NL', language: 'nl', timezone: 'Europe/Amsterdam' } }),
    prisma.contact.create({ data: { name: 'Ana Popescu', email: 'ana.p@example.com', phone: '+40215551010', whatsapp: '+40215551010', region: 'Europe', city: 'Bucharest', country: 'RO', language: 'ro', timezone: 'Europe/Bucharest' } }),
    prisma.contact.create({ data: { name: 'Oleg Kovalenko', email: 'oleg.k@example.com', phone: '+380445551011', telegram: '@olegk', signal: '+380445551011', region: 'Europe', city: 'Kyiv', country: 'UA', language: 'uk', timezone: 'Europe/Kyiv' } }),

    // East Africa
    prisma.contact.create({ data: { name: 'Joseph Mwangi', email: 'joseph.m@example.com', phone: '+254725551012', whatsapp: '+254725551012', region: 'East Africa', city: 'Nairobi', country: 'KE', language: 'sw', timezone: 'Africa/Nairobi' } }),
    prisma.contact.create({ data: { name: 'Grace Nakamya', email: 'grace.n@example.com', phone: '+256775551013', whatsapp: '+256775551013', region: 'East Africa', city: 'Kampala', country: 'UG', language: 'en', timezone: 'Africa/Kampala' } }),
    prisma.contact.create({ data: { name: 'Emmanuel Shirima', email: 'emmanuel.s@example.com', phone: '+255755551014', whatsapp: '+255755551014', region: 'East Africa', city: 'Dar es Salaam', country: 'TZ', language: 'sw', timezone: 'Africa/Dar_es_Salaam' } }),
    prisma.contact.create({ data: { name: 'Tigist Bekele', email: 'tigist.b@example.com', phone: '+251915551015', whatsapp: '+251915551015', telegram: '@tigistb', region: 'East Africa', city: 'Addis Ababa', country: 'ET', language: 'am', timezone: 'Africa/Addis_Ababa' } }),

    // West Africa
    prisma.contact.create({ data: { name: 'Chidi Okafor', email: 'chidi.o@example.com', phone: '+234815551016', whatsapp: '+234815551016', region: 'West Africa', city: 'Lagos', country: 'NG', language: 'en', timezone: 'Africa/Lagos' } }),
    prisma.contact.create({ data: { name: 'Ama Mensah', email: 'ama.m@example.com', phone: '+233245551017', whatsapp: '+233245551017', region: 'West Africa', city: 'Accra', country: 'GH', language: 'en', timezone: 'Africa/Accra' } }),

    // Southern Africa
    prisma.contact.create({ data: { name: 'Thabo Ndlovu', email: 'thabo.n@example.com', phone: '+27825551018', whatsapp: '+27825551018', region: 'Southern Africa', city: 'Johannesburg', country: 'ZA', language: 'en', timezone: 'Africa/Johannesburg' } }),
    prisma.contact.create({ data: { name: 'Tendai Moyo', email: 'tendai.m@example.com', phone: '+263775551019', whatsapp: '+263775551019', region: 'Southern Africa', city: 'Harare', country: 'ZW', language: 'en', timezone: 'Africa/Harare' } }),

    // Southeast Asia
    prisma.contact.create({ data: { name: 'Miguel Santos', email: 'miguel.s@example.com', phone: '+639175551020', whatsapp: '+639175551020', telegram: '@miguels', region: 'Southeast Asia', city: 'Manila', country: 'PH', language: 'tl', timezone: 'Asia/Manila' } }),
    prisma.contact.create({ data: { name: 'Dewi Sari', email: 'dewi.s@example.com', phone: '+628125551021', whatsapp: '+628125551021', region: 'Southeast Asia', city: 'Jakarta', country: 'ID', language: 'id', timezone: 'Asia/Jakarta' } }),
    prisma.contact.create({ data: { name: 'Linh Nguyen', email: 'linh.n@example.com', phone: '+849055551022', whatsapp: '+849055551022', region: 'Southeast Asia', city: 'Ho Chi Minh City', country: 'VN', language: 'vi', timezone: 'Asia/Ho_Chi_Minh' } }),
    prisma.contact.create({ data: { name: 'Somchai Prasert', email: 'somchai.p@example.com', phone: '+668155551023', whatsapp: '+668155551023', region: 'Southeast Asia', city: 'Bangkok', country: 'TH', language: 'th', timezone: 'Asia/Bangkok' } }),

    // South Asia
    prisma.contact.create({ data: { name: 'Priya Sharma', email: 'priya.s@example.com', phone: '+919855551024', whatsapp: '+919855551024', telegram: '@priyas', region: 'South Asia', city: 'Delhi', country: 'IN', language: 'hi', timezone: 'Asia/Kolkata' } }),
    prisma.contact.create({ data: { name: 'Ravi Kumar', email: 'ravi.k@example.com', phone: '+919445551025', whatsapp: '+919445551025', region: 'South Asia', city: 'Chennai', country: 'IN', language: 'ta', timezone: 'Asia/Kolkata' } }),
    prisma.contact.create({ data: { name: 'Amir Hassan', email: 'amir.h@example.com', phone: '+923005551026', whatsapp: '+923005551026', region: 'South Asia', city: 'Lahore', country: 'PK', language: 'ur', timezone: 'Asia/Karachi' } }),
    prisma.contact.create({ data: { name: 'Saman Perera', email: 'saman.p@example.com', phone: '+94775551027', whatsapp: '+94775551027', region: 'South Asia', city: 'Colombo', country: 'LK', language: 'si', timezone: 'Asia/Colombo' } }),

    // Middle East
    prisma.contact.create({ data: { name: 'Tariq Al-Rashid', email: 'tariq.r@example.com', phone: '+962795551028', whatsapp: '+962795551028', signal: '+962795551028', region: 'Middle East', city: 'Amman', country: 'JO', language: 'ar', timezone: 'Asia/Amman' } }),
    prisma.contact.create({ data: { name: 'Nadia Khoury', email: 'nadia.k@example.com', phone: '+961715551029', whatsapp: '+961715551029', signal: '+961715551029', region: 'Middle East', city: 'Beirut', country: 'LB', language: 'ar', timezone: 'Asia/Beirut' } }),
    prisma.contact.create({ data: { name: 'Mehmet Yilmaz', email: 'mehmet.y@example.com', phone: '+905325551030', whatsapp: '+905325551030', telegram: '@mehmety', region: 'Middle East', city: 'Istanbul', country: 'TR', language: 'tr', timezone: 'Europe/Istanbul' } }),
    prisma.contact.create({ data: { name: 'Amira Farouk', email: 'amira.f@example.com', phone: '+201005551031', whatsapp: '+201005551031', region: 'Middle East', city: 'Cairo', country: 'EG', language: 'ar', timezone: 'Africa/Cairo' } }),

    // South America
    prisma.contact.create({ data: { name: 'Lucas Oliveira', email: 'lucas.o@example.com', phone: '+551155551032', whatsapp: '+551155551032', region: 'South America', city: 'Sao Paulo', country: 'BR', language: 'pt', timezone: 'America/Sao_Paulo' } }),
    prisma.contact.create({ data: { name: 'Carolina Restrepo', email: 'carolina.r@example.com', phone: '+573105551033', whatsapp: '+573105551033', region: 'South America', city: 'Bogota', country: 'CO', language: 'es', timezone: 'America/Bogota' } }),
    prisma.contact.create({ data: { name: 'Diego Fernandez', email: 'diego.f@example.com', phone: '+541155551034', whatsapp: '+541155551034', region: 'South America', city: 'Buenos Aires', country: 'AR', language: 'es', timezone: 'America/Argentina/Buenos_Aires' } }),

    // Central America / Caribbean
    prisma.contact.create({ data: { name: 'Rosa Hernandez', email: 'rosa.h@example.com', phone: '+525555551035', whatsapp: '+525555551035', region: 'Central America', city: 'Mexico City', country: 'MX', language: 'es', timezone: 'America/Mexico_City' } }),
    prisma.contact.create({ data: { name: 'Carlos Lopez', email: 'carlos.l@example.com', phone: '+502555551036', whatsapp: '+502555551036', region: 'Central America', city: 'Guatemala City', country: 'GT', language: 'es', timezone: 'America/Guatemala' } }),
    prisma.contact.create({ data: { name: 'Jean-Pierre Baptiste', email: 'jp.b@example.com', phone: '+509555551037', whatsapp: '+509555551037', region: 'Central America', city: 'Port-au-Prince', country: 'HT', language: 'fr', timezone: 'America/Port-au-Prince' } }),

    // East Asia
    prisma.contact.create({ data: { name: 'Min-jun Park', email: 'minjun.p@example.com', phone: '+82105551038', whatsapp: '+82105551038', telegram: '@minjunp', region: 'East Asia', city: 'Seoul', country: 'KR', language: 'ko', timezone: 'Asia/Seoul' } }),
    prisma.contact.create({ data: { name: 'Yuki Tanaka', email: 'yuki.t@example.com', phone: '+81905551039', region: 'East Asia', city: 'Tokyo', country: 'JP', language: 'ja', timezone: 'Asia/Tokyo' } }),

    // Oceania
    prisma.contact.create({ data: { name: 'Liam O\'Brien', email: 'liam.ob@example.com', phone: '+61425551040', whatsapp: '+61425551040', region: 'Oceania', city: 'Sydney', country: 'AU', language: 'en', timezone: 'Australia/Sydney' } }),
    prisma.contact.create({ data: { name: 'Aroha Williams', email: 'aroha.w@example.com', phone: '+64215551041', whatsapp: '+64215551041', region: 'Oceania', city: 'Auckland', country: 'NZ', language: 'en', timezone: 'Pacific/Auckland' } }),
  ])

  console.log(`  Created ${contacts.length} contacts across 12 regions`)

  // ── CONTACT-SEGMENT ASSIGNMENTS ──
  // Field Leaders: Joseph (KE), Grace (UG), Miguel (PH), Priya (IN), Tariq (JO), Thabo (ZA), Chidi (NG), Lucas (BR), Rosa (MX), Oleg (UA)
  const fieldLeaderContacts = [contacts[11], contacts[12], contacts[19], contacts[23], contacts[27], contacts[17], contacts[15], contacts[31], contacts[34], contacts[10]]
  // Supporters: David (US), Sarah (US), James (CA), Emma (UK), Hans (DE), Liam (AU), Marcus (US), Jan (NL)
  const supporterContacts = [contacts[0], contacts[1], contacts[4], contacts[5], contacts[6], contacts[39], contacts[2], contacts[8]]
  // Seekers: Dewi (ID), Linh (VN), Somchai (TH), Amira (EG), Carolina (CO), Tendai (ZW), Ama (GH), Saman (LK), Ana (RO)
  const seekerContacts = [contacts[20], contacts[21], contacts[22], contacts[30], contacts[32], contacts[18], contacts[16], contacts[26], contacts[9]]
  // Prayer Partners: Sarah (US), Sophie (FR), Grace (UG), Aroha (NZ), Maria (US), Emma (UK), Ana (RO), Nadia (LB)
  const prayerContacts = [contacts[1], contacts[7], contacts[12], contacts[40], contacts[3], contacts[5], contacts[9], contacts[28]]
  // Translators: Sophie (FR), Hans (DE), Ravi (IN), Amir (PK), Min-jun (KR), Jean-Pierre (HT), Mehmet (TR), Emmanuel (TZ)
  const translatorContacts = [contacts[7], contacts[6], contacts[24], contacts[25], contacts[37], contacts[36], contacts[29], contacts[13]]

  const segmentAssignments = []
  for (const c of fieldLeaderContacts) {
    segmentAssignments.push({ contactId: c.id, segmentId: fieldLeaders.id })
  }
  for (const c of supporterContacts) {
    segmentAssignments.push({ contactId: c.id, segmentId: supporters.id })
  }
  for (const c of seekerContacts) {
    segmentAssignments.push({ contactId: c.id, segmentId: seekers.id })
  }
  for (const c of prayerContacts) {
    segmentAssignments.push({ contactId: c.id, segmentId: prayerPartners.id })
  }
  for (const c of translatorContacts) {
    segmentAssignments.push({ contactId: c.id, segmentId: translators.id })
  }

  // Deduplicate (some contacts are in multiple segments)
  const uniqueAssignments = []
  const seen = new Set()
  for (const a of segmentAssignments) {
    const key = `${a.contactId}-${a.segmentId}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueAssignments.push(a)
    }
  }

  for (const a of uniqueAssignments) {
    await prisma.contactSegment.create({ data: a })
  }
  console.log(`  Created ${uniqueAssignments.length} contact-segment assignments`)

  // Update segment contact counts
  for (const seg of segments) {
    const count = await prisma.contactSegment.count({ where: { segmentId: seg.id } })
    await prisma.segment.update({ where: { id: seg.id }, data: { contactCount: count } })
  }

  // ── CAMPAIGNS ──
  const campaign1 = await prisma.campaign.create({
    data: {
      title: 'February 2026 Ministry Update',
      type: 'update',
      body: 'Dear family,\n\nWe are thrilled to share what God has been doing across the globe this month. In East Africa, three new house churches have been planted in rural Kenya. Our field leaders in Southeast Asia report unprecedented openness in Vietnam, with 12 new seekers joining study groups. The translation team has completed Swahili and Tagalog versions of the core discipleship series.\n\nPlease continue to pray for our workers in sensitive regions. The harvest is plentiful.\n\nIn His service,\nTsunami Unleashed Team',
      status: 'sent',
      priority: 'normal',
      language: 'en',
      createdBy: 'HQ Team',
      approvedBy: 'Leadership',
      approvedAt: new Date('2026-02-01T10:00:00Z'),
      scheduledAt: new Date('2026-02-01T14:00:00Z'),
      sentAt: new Date('2026-02-01T14:00:00Z'),
    },
  })

  const campaign2 = await prisma.campaign.create({
    data: {
      title: 'Urgent: Persecution in Region',
      type: 'prayer',
      body: 'Urgent prayer needed. Several of our field leaders in a sensitive Middle Eastern region are facing increased government scrutiny. Two house churches have been forced to relocate. Our brothers and sisters need prayer for safety, wisdom, and boldness.\n\nPlease pray:\n- For physical safety of all involved\n- For wisdom in how to continue meeting\n- For courage and peace that surpasses understanding\n- That even this opposition would result in the spread of the gospel',
      status: 'sent',
      priority: 'urgent',
      isUrgent: true,
      language: 'en',
      createdBy: 'HQ Team',
      sentAt: new Date('2026-02-10T08:00:00Z'),
    },
  })

  const campaign3 = await prisma.campaign.create({
    data: {
      title: 'Field Notice: New Translation Resources Available',
      type: 'field_notice',
      body: 'Field leaders and translators,\n\nNew translation resources are now available on the shared drive. The core discipleship curriculum (12 lessons) has been professionally translated into Arabic, Hindi, and Portuguese. AI-assisted drafts are available in 15 additional languages for review.\n\nPlease download the materials relevant to your region and begin review. If you find translation errors, note them in the feedback sheet.\n\nThank you for your partnership in making these resources accessible to every nation.',
      status: 'approved',
      priority: 'normal',
      language: 'en',
      createdBy: 'Translation Team',
      approvedBy: 'HQ Team',
      approvedAt: new Date('2026-02-14T12:00:00Z'),
      scheduledAt: new Date('2026-02-17T09:00:00Z'),
    },
  })

  console.log('  Created 3 campaigns')

  // ── CAMPAIGN VERSIONS ──
  // Campaign 1 - email and whatsapp versions
  await prisma.campaignVersion.create({
    data: {
      campaignId: campaign1.id,
      channel: 'email',
      subject: 'February 2026 Ministry Update - Tsunami Unleashed',
      body: campaign1.body,
      language: 'en',
      isAiGenerated: false,
    },
  })
  await prisma.campaignVersion.create({
    data: {
      campaignId: campaign1.id,
      channel: 'whatsapp',
      body: '*February Ministry Update*\n\n3 new house churches planted in Kenya\n12 new seekers in Vietnam study groups\nSwahili & Tagalog translations complete\n\nPraise God for His faithfulness! Please keep praying for workers in sensitive regions.',
      language: 'en',
      isAiGenerated: true,
    },
  })
  await prisma.campaignVersion.create({
    data: {
      campaignId: campaign1.id,
      channel: 'sms',
      body: 'Tsunami Update: 3 new churches in Kenya, 12 seekers in Vietnam, new translations complete. Pray for workers in sensitive areas. -TU Team',
      language: 'en',
      isAiGenerated: true,
    },
  })

  // Campaign 2 - prayer request versions
  await prisma.campaignVersion.create({
    data: {
      campaignId: campaign2.id,
      channel: 'email',
      subject: 'URGENT PRAYER: Persecution in Sensitive Region',
      body: campaign2.body,
      language: 'en',
      isAiGenerated: false,
    },
  })
  await prisma.campaignVersion.create({
    data: {
      campaignId: campaign2.id,
      channel: 'whatsapp',
      body: '*URGENT PRAYER NEEDED*\n\nField leaders in Middle East facing government scrutiny. 2 house churches forced to relocate.\n\nPray for:\n- Physical safety\n- Wisdom to continue meeting\n- Courage and peace\n- Gospel spreading despite opposition',
      language: 'en',
      isAiGenerated: true,
    },
  })

  console.log('  Created 5 campaign versions')

  // ── BROADCASTS ──
  const broadcast1 = await prisma.broadcast.create({
    data: {
      campaignId: campaign1.id,
      segmentId: supporters.id,
      channels: JSON.stringify(['email', 'whatsapp']),
      scheduledAt: new Date('2026-02-01T14:00:00Z'),
      sentAt: new Date('2026-02-01T14:05:00Z'),
      status: 'sent',
      totalRecipients: 8,
      delivered: 7,
      failed: 1,
      opened: 5,
    },
  })

  const broadcast2 = await prisma.broadcast.create({
    data: {
      campaignId: campaign2.id,
      segmentId: prayerPartners.id,
      channels: JSON.stringify(['email', 'whatsapp', 'sms']),
      sentAt: new Date('2026-02-10T08:00:00Z'),
      status: 'sent',
      totalRecipients: 8,
      delivered: 8,
      failed: 0,
      opened: 7,
    },
  })

  console.log('  Created 2 broadcasts')

  // ── DELIVERY LOGS ──
  // Sample delivery logs for broadcast 1 (supporters)
  for (let i = 0; i < supporterContacts.length; i++) {
    const contact = supporterContacts[i]
    const isFailed = i === 3 // One failure for realism
    await prisma.deliveryLog.create({
      data: {
        broadcastId: broadcast1.id,
        contactId: contact.id,
        channel: 'email',
        status: isFailed ? 'failed' : (i < 5 ? 'opened' : 'delivered'),
        sentAt: new Date('2026-02-01T14:05:00Z'),
        deliveredAt: isFailed ? null : new Date('2026-02-01T14:06:00Z'),
        openedAt: (!isFailed && i < 5) ? new Date('2026-02-01T15:30:00Z') : null,
        errorMessage: isFailed ? 'Mailbox full' : null,
      },
    })
  }
  console.log('  Created delivery logs')

  // ── SEQUENCES ──
  const sequence1 = await prisma.sequence.create({
    data: {
      name: 'New Field Worker Onboarding',
      description: 'Welcome sequence for new field leaders joining the network. Introduces resources, communication channels, and reporting expectations.',
      segmentId: fieldLeaders.id,
      trigger: 'segment_join',
      status: 'active',
      totalSteps: 5,
    },
  })

  // Sequence steps
  await prisma.sequenceStep.create({
    data: {
      sequenceId: sequence1.id,
      stepNumber: 1,
      delayDays: 0,
      subject: 'Welcome to Tsunami Unleashed Field Network',
      body: 'Welcome to the Tsunami Unleashed field network! We are honored to partner with you in reaching your region. This onboarding sequence will introduce you to our tools, resources, and communication channels over the next few weeks.\n\nFirst, please confirm you have access to the shared Google Drive folder for your region. If not, reply to this message and we will get you set up.',
      channels: JSON.stringify(['email', 'whatsapp']),
    },
  })
  await prisma.sequenceStep.create({
    data: {
      sequenceId: sequence1.id,
      stepNumber: 2,
      delayDays: 3,
      subject: 'Your Ministry Resources',
      body: 'Here are the core resources available to you:\n\n1. Discipleship Curriculum - 12 lessons available in 20+ languages\n2. Church Planting Guide - Step-by-step handbook\n3. Leadership Development Series - 8 modules\n4. CC0 Content Library - All content free to use, translate, and distribute\n\nAll materials are on the shared drive. Download what you need for your region and language.',
      channels: JSON.stringify(['email']),
    },
  })
  await prisma.sequenceStep.create({
    data: {
      sequenceId: sequence1.id,
      stepNumber: 3,
      delayDays: 7,
      subject: 'Communication Channels & Reporting',
      body: 'Staying connected is important for mutual encouragement and coordination.\n\nCommunication channels:\n- Monthly updates from HQ via this system\n- WhatsApp for urgent matters\n- Email for detailed reports\n\nMonthly reporting: Please submit a brief update on the 1st of each month covering baptisms, new groups, challenges, and prayer needs.',
      channels: JSON.stringify(['email', 'whatsapp']),
    },
  })
  await prisma.sequenceStep.create({
    data: {
      sequenceId: sequence1.id,
      stepNumber: 4,
      delayDays: 14,
      subject: 'Security & Best Practices',
      body: 'Working in sensitive regions requires wisdom. Key security practices:\n\n- Never use real names in digital communications for contacts in restricted areas\n- Use Signal for sensitive conversations\n- Keep physical materials discrete\n- Know your local legal context\n- Report security concerns immediately via Signal\n\nYour safety and the safety of those you serve is paramount.',
      channels: JSON.stringify(['email', 'signal']),
    },
  })
  await prisma.sequenceStep.create({
    data: {
      sequenceId: sequence1.id,
      stepNumber: 5,
      delayDays: 21,
      subject: 'You Are Not Alone',
      body: 'As you complete this onboarding, remember: you are part of a global family. Hundreds of field workers across every continent are laboring alongside you.\n\nNext steps:\n- Connect with your regional coordinator\n- Join the monthly prayer call\n- Start using the CC0 content in your local language\n\nWe are praying for you. The Lord who called you is faithful.',
      channels: JSON.stringify(['email', 'whatsapp']),
    },
  })

  console.log('  Created 1 sequence with 5 steps')

  // ── SEQUENCE ENROLLMENTS ──
  // 3 contacts at different stages
  await prisma.sequenceEnrollment.create({
    data: {
      sequenceId: sequence1.id,
      contactId: contacts[17].id, // Thabo - just started
      currentStep: 1,
      status: 'active',
      nextSendAt: new Date('2026-02-19T09:00:00Z'),
      startedAt: new Date('2026-02-13T09:00:00Z'),
    },
  })
  await prisma.sequenceEnrollment.create({
    data: {
      sequenceId: sequence1.id,
      contactId: contacts[15].id, // Chidi - midway
      currentStep: 3,
      status: 'active',
      nextSendAt: new Date('2026-02-20T09:00:00Z'),
      startedAt: new Date('2026-01-25T09:00:00Z'),
    },
  })
  await prisma.sequenceEnrollment.create({
    data: {
      sequenceId: sequence1.id,
      contactId: contacts[19].id, // Miguel - completed
      currentStep: 5,
      status: 'completed',
      startedAt: new Date('2026-01-01T09:00:00Z'),
      completedAt: new Date('2026-01-22T09:00:00Z'),
    },
  })

  console.log('  Created 3 sequence enrollments')

  // ── TEMPLATES ──
  await prisma.template.create({
    data: {
      name: 'Monthly Ministry Update',
      type: 'update',
      body: 'Dear family,\n\nHere is what God has been doing this month:\n\n[HIGHLIGHTS]\n\nPrayer needs:\n[PRAYER_NEEDS]\n\nThank you for your partnership.\n\nIn His service,\nTsunami Unleashed Team',
      channelHints: JSON.stringify({
        email: 'Use full version with greeting and sign-off',
        whatsapp: 'Bold highlights, keep under 500 chars',
        sms: 'Top 2-3 bullet points only, under 160 chars',
      }),
    },
  })
  await prisma.template.create({
    data: {
      name: 'Prayer Request Broadcast',
      type: 'prayer',
      body: 'Prayer needed:\n\n[SITUATION]\n\nPlease pray for:\n- [PRAYER_POINT_1]\n- [PRAYER_POINT_2]\n- [PRAYER_POINT_3]\n\nThank you for standing in the gap.',
      channelHints: JSON.stringify({
        email: 'Full detail with context',
        whatsapp: 'Start with PRAYER NEEDED in bold',
        sms: 'Brief request, one sentence',
      }),
    },
  })
  await prisma.template.create({
    data: {
      name: 'Emergency Alert',
      type: 'urgent',
      body: 'URGENT: [SITUATION]\n\n[DETAILS]\n\nImmediate action needed:\n[ACTION_ITEMS]\n\nThis message was sent to all contacts. Please respond if you need assistance.',
    },
  })
  await prisma.template.create({
    data: {
      name: 'Field Notice',
      type: 'field_notice',
      body: 'Field leaders and workers,\n\n[NOTICE_CONTENT]\n\nAction required:\n[ACTION_ITEMS]\n\nDeadline: [DEADLINE]\n\nThank you for your faithfulness.',
    },
  })
  await prisma.template.create({
    data: {
      name: 'General Announcement',
      type: 'announcement',
      body: 'Announcement: [TITLE]\n\n[DETAILS]\n\nFor questions, contact [CONTACT_INFO].',
    },
  })

  console.log('  Created 5 templates')

  // ── ALERTS ──
  await prisma.alert.create({
    data: {
      severity: 'warning',
      category: 'delivery_failure',
      message: 'Email delivery failed for 1 recipient in February Ministry Update broadcast',
      details: JSON.stringify({ broadcastId: broadcast1.id, failedCount: 1, channel: 'email' }),
    },
  })
  await prisma.alert.create({
    data: {
      severity: 'info',
      category: 'system_error',
      message: 'Urgent prayer broadcast sent successfully to 8 prayer partners',
      details: JSON.stringify({ broadcastId: broadcast2.id, deliveredCount: 8 }),
      isRead: true,
    },
  })

  console.log('  Created 2 alerts')

  // ── METRICS ──
  await prisma.communicationMetric.create({
    data: {
      date: new Date('2026-02-01'),
      messagesSent: 16,
      messagesDelivered: 15,
      messagesFailed: 1,
      messagesOpened: 10,
      deliveryRate: 93.75,
      openRate: 66.67,
      campaignsSent: 1,
      urgentAlertsSent: 0,
      prayerRequestsSent: 0,
      channelBreakdown: JSON.stringify({ email: 8, whatsapp: 8 }),
      regionBreakdown: JSON.stringify({ 'North America': 6, 'Europe': 6, 'Oceania': 2, 'East Asia': 2 }),
    },
  })
  await prisma.communicationMetric.create({
    data: {
      date: new Date('2026-02-10'),
      messagesSent: 24,
      messagesDelivered: 24,
      messagesFailed: 0,
      messagesOpened: 21,
      deliveryRate: 100.0,
      openRate: 87.5,
      campaignsSent: 1,
      urgentAlertsSent: 0,
      prayerRequestsSent: 1,
      channelBreakdown: JSON.stringify({ email: 8, whatsapp: 8, sms: 8 }),
      regionBreakdown: JSON.stringify({ 'North America': 6, 'Europe': 6, 'East Africa': 4, 'Oceania': 4, 'Middle East': 4 }),
    },
  })

  console.log('  Created 2 daily metrics')

  console.log('\nSeed complete!')
  console.log(`  Segments: ${segments.length}`)
  console.log(`  Contacts: ${contacts.length}`)
  console.log(`  Assignments: ${uniqueAssignments.length}`)
  console.log(`  Campaigns: 3`)
  console.log(`  Campaign Versions: 5`)
  console.log(`  Broadcasts: 2`)
  console.log(`  Sequences: 1 (5 steps, 3 enrollments)`)
  console.log(`  Templates: 5`)
  console.log(`  Alerts: 2`)
  console.log(`  Metrics: 2 days`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
