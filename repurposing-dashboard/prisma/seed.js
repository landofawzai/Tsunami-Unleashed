// Seed data for Content Repurposing + Translation Dashboard
// Creates realistic sample data across all 11 models

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function cuid() {
  return 'c' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4)
}

async function main() {
  console.log('Seeding Content Repurposing database...')

  // ── LANGUAGE CONFIGS ──
  const languages = [
    { id: cuid(), code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isActive: true, priority: 1, hasLocalReviewer: true, reviewerContact: 'hindi-reviewer@example.com', totalTranslations: 0 },
    { id: cuid(), code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isActive: true, priority: 2, hasLocalReviewer: false, reviewerContact: null, totalTranslations: 0 },
    { id: cuid(), code: 'mai', name: 'Maithili', nativeName: 'मैथिली', isActive: true, priority: 3, hasLocalReviewer: false, reviewerContact: null, totalTranslations: 0 },
  ]

  for (const lang of languages) {
    await prisma.languageConfig.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    })
  }
  console.log(`  ✓ ${languages.length} language configs`)

  // ── SYSTEM SETTINGS ──
  const settings = [
    { key: 'auto_translate', value: 'true', description: 'Automatically translate new derivatives' },
    { key: 'auto_generate_derivatives', value: 'true', description: 'Auto-generate all derivative types for new sources' },
    { key: 'default_derivative_types', value: JSON.stringify(['blog_post', 'social_quote', 'thread_summary', 'study_guide', 'newsletter_excerpt']), description: 'Default derivative types to generate' },
    { key: 'default_languages', value: JSON.stringify(['hi', 'bn', 'mai']), description: 'Default target languages for translation' },
    { key: 'max_concurrent_jobs', value: '3', description: 'Maximum concurrent processing jobs' },
    { key: 'fal_model', value: 'fal-ai/flux/schnell', description: 'FAL.AI model for quote graphic generation' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { id: cuid(), ...setting },
    })
  }
  console.log(`  ✓ ${settings.length} system settings`)

  // ── SOURCE CONTENT ──
  const source1Id = cuid()
  const source2Id = cuid()
  const source3Id = cuid()

  const sources = [
    {
      id: source1Id,
      contentId: 'src-sermon-romans8-2026',
      title: 'Romans 8: Life in the Spirit — Sunday Sermon',
      contentType: 'sermon',
      mediaType: 'video',
      language: 'en',
      sourceUrl: 'https://drive.google.com/file/d/example1',
      driveFileId: 'gdrive-file-id-001',
      durationSeconds: 2520, // 42 minutes
      wordCount: 6300,
      transcription: 'Good morning, church family. Today we are going to explore Romans chapter 8, one of the most powerful passages in all of Scripture. Paul writes, "Therefore, there is now no condemnation for those who are in Christ Jesus." This is not merely a theological statement — it is the foundation of our freedom...\n\n[Full 42-minute transcription — 6,300 words covering verses 1-39, with applications for daily living, prayer, and the assurance of God\'s love that cannot be separated from us.]',
      isTranscribed: true,
      tags: JSON.stringify(['romans', 'holy-spirit', 'freedom', 'assurance', 'sunday-sermon']),
      metadata: JSON.stringify({ contentId: 'src-sermon-romans8-2026', source: 'Content Creation', format: 'mp4', resolution: '1080p' }),
      status: 'ready',
    },
    {
      id: source2Id,
      contentId: 'src-teaching-prayer-2026',
      title: 'The Practice of Persistent Prayer — Weekly Teaching',
      contentType: 'teaching',
      mediaType: 'audio',
      language: 'en',
      sourceUrl: 'https://drive.google.com/file/d/example2',
      driveFileId: 'gdrive-file-id-002',
      durationSeconds: 1800, // 30 minutes
      wordCount: 4500,
      transcription: 'Welcome to our weekly teaching series. Today we examine what Jesus taught about persistent prayer in Luke 18. The parable of the persistent widow teaches us that God honors faithful, continual prayer...\n\n[Full 30-minute transcription — 4,500 words on prayer practices, biblical examples, and practical application for daily prayer life.]',
      isTranscribed: true,
      tags: JSON.stringify(['prayer', 'persistence', 'luke-18', 'teaching', 'spiritual-disciplines']),
      metadata: JSON.stringify({ contentId: 'src-teaching-prayer-2026', source: 'Content Creation', format: 'mp3', bitrate: '192kbps' }),
      status: 'ready',
    },
    {
      id: source3Id,
      contentId: 'src-article-persecution-2026',
      title: 'Standing Firm: Encouragement for Believers Under Persecution',
      contentType: 'article',
      mediaType: 'text',
      language: 'en',
      sourceUrl: 'https://drive.google.com/file/d/example3',
      driveFileId: 'gdrive-file-id-003',
      durationSeconds: null,
      wordCount: 2800,
      transcription: null,
      isTranscribed: false,
      tags: JSON.stringify(['persecution', 'encouragement', 'faith', 'endurance', 'article']),
      metadata: JSON.stringify({ contentId: 'src-article-persecution-2026', source: 'Content Creation', format: 'docx', body: 'Brothers and sisters around the world are facing increasing pressure for their faith. In many nations, simply gathering to worship or sharing the Gospel carries real risk. Yet Scripture is clear: "Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven" (Matthew 5:10)...\n\n[Full 2,800-word article covering biblical perspective on persecution, practical encouragement, and how the global body can support persecuted believers.]' }),
      status: 'ready',
    },
  ]

  for (const source of sources) {
    await prisma.sourceContent.upsert({
      where: { contentId: source.contentId },
      update: {},
      create: source,
    })
  }
  console.log(`  ✓ ${sources.length} source content items`)

  // ── DERIVATIVE TEMPLATES ──
  const templates = [
    {
      id: cuid(), name: 'Blog Post Generator', derivativeType: 'blog_post',
      description: 'Generates a long-form blog article from sermon/teaching transcription',
      systemPrompt: 'You are a skilled Christian writer creating blog posts from sermon transcriptions. Write in an engaging, accessible style that preserves the theological depth and pastoral heart of the original message. Include Scripture references. Use headers and paragraphs for readability. CC0 public domain — no attribution required.',
      userPromptTemplate: 'Transform this sermon/teaching transcription into a compelling blog post (800-1200 words):\n\nTitle: {title}\nContent Type: {contentType}\n\nTranscription:\n{transcription}',
      maxTokens: 2048, outputFormat: 'markdown', isActive: true, usageCount: 3,
    },
    {
      id: cuid(), name: 'Social Media Quote Extractor', derivativeType: 'social_quote',
      description: 'Extracts 5-8 shareable quotes from content',
      systemPrompt: 'You are extracting powerful, shareable quotes from Christian content. Each quote should be 1-3 sentences, stand alone without context, and be spiritually impactful. Include the Scripture reference if applicable. Format as a numbered list.',
      userPromptTemplate: 'Extract 5-8 powerful, shareable quotes from this content:\n\nTitle: {title}\n\n{transcription}',
      maxTokens: 1024, outputFormat: 'text', isActive: true, usageCount: 3,
    },
    {
      id: cuid(), name: 'Thread Summary Creator', derivativeType: 'thread_summary',
      description: 'Creates a multi-part thread summary (Twitter/X style)',
      systemPrompt: 'You are creating a thread-style summary of Christian teaching content. Write 8-12 numbered tweets (each under 280 characters). Start with a hook. End with a call to action or reflection. Include key Scripture references.',
      userPromptTemplate: 'Create a thread summary (8-12 parts, each under 280 characters) from:\n\nTitle: {title}\n\n{transcription}',
      maxTokens: 1024, outputFormat: 'text', isActive: true, usageCount: 2,
    },
    {
      id: cuid(), name: 'Study Guide Builder', derivativeType: 'study_guide',
      description: 'Generates study questions and reflection points',
      systemPrompt: 'You are creating a Bible study guide from a sermon/teaching. Include: 1) Key Scripture passages, 2) 5-7 discussion questions, 3) Personal reflection prompts, 4) Prayer points, 5) Application challenges. Format clearly with headers.',
      userPromptTemplate: 'Create a study guide from this teaching:\n\nTitle: {title}\nContent Type: {contentType}\n\n{transcription}',
      maxTokens: 1536, outputFormat: 'markdown', isActive: true, usageCount: 2,
    },
    {
      id: cuid(), name: 'Newsletter Excerpt Writer', derivativeType: 'newsletter_excerpt',
      description: 'Creates a condensed newsletter-friendly summary',
      systemPrompt: 'You are writing a concise newsletter excerpt from Christian content. Keep it to 150-250 words. Include the main takeaway, one key Scripture, and a compelling reason to engage with the full content. Warm, conversational tone.',
      userPromptTemplate: 'Write a newsletter excerpt (150-250 words) from:\n\nTitle: {title}\n\n{transcription}',
      maxTokens: 512, outputFormat: 'text', isActive: true, usageCount: 1,
    },
    {
      id: cuid(), name: 'Audio Transcription Cleaner', derivativeType: 'audio_transcription',
      description: 'Cleans and formats raw transcription for readability',
      systemPrompt: 'You are cleaning a raw speech-to-text transcription for readability. Fix punctuation, add paragraph breaks at natural topic transitions, remove filler words (um, uh, you know), but preserve the speaker\'s voice and style. Do not add or change content.',
      userPromptTemplate: 'Clean and format this raw transcription for readability:\n\nTitle: {title}\n\n{transcription}',
      maxTokens: 4096, outputFormat: 'text', isActive: true, usageCount: 2,
    },
    {
      id: cuid(), name: 'Video Clip Marker', derivativeType: 'video_clip_meta',
      description: 'Identifies key moments for video clips with timestamps',
      systemPrompt: 'You are analyzing a sermon/teaching transcription to identify 3-5 key moments that would make excellent short video clips (30-90 seconds each). For each clip, provide: title, start timestamp estimate, end timestamp estimate, why this segment is impactful, and a suggested caption.',
      userPromptTemplate: 'Identify 3-5 key video clip moments from this content (total duration: {duration} seconds):\n\nTitle: {title}\n\n{transcription}',
      maxTokens: 1024, outputFormat: 'text', isActive: true, usageCount: 1,
    },
    {
      id: cuid(), name: 'Quote Graphic Text', derivativeType: 'quote_graphic',
      description: 'Selects the single most powerful quote for image generation',
      systemPrompt: 'You are selecting the single most visually powerful quote from Christian content for a quote graphic image. Choose a quote that is: 1) Under 25 words, 2) Spiritually impactful, 3) Visually balanced for an image overlay. Return ONLY the quote text and the Scripture reference if applicable.',
      userPromptTemplate: 'Select the single most powerful quote (under 25 words) for a quote graphic from:\n\nTitle: {title}\n\n{transcription}',
      maxTokens: 256, outputFormat: 'text', isActive: true, usageCount: 1,
    },
  ]

  for (const template of templates) {
    await prisma.derivativeTemplate.create({ data: template })
  }
  console.log(`  ✓ ${templates.length} derivative templates`)

  // ── DERIVATIVES ──
  const derivatives = [
    // From Source 1 (Romans 8 Sermon)
    {
      id: cuid(), contentId: 'deriv-romans8-blog-01', parentContentId: 'src-sermon-romans8-2026', sourceContentId: source1Id,
      derivativeType: 'blog_post', title: 'Romans 8: The Foundation of Our Freedom in Christ',
      body: '# Romans 8: The Foundation of Our Freedom in Christ\n\nPaul\'s letter to the Romans reaches its crescendo in chapter 8, where he declares the most liberating truth in all of Scripture: "There is now no condemnation for those who are in Christ Jesus."\n\n## Living by the Spirit\n\nThe contrast Paul draws between life in the flesh and life in the Spirit is not about willpower...\n\n[Full 1,100-word blog post exploring Romans 8 themes of freedom, Spirit-led living, and the assurance of God\'s unbreakable love.]',
      language: 'en', format: 'markdown', wordCount: 1100, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: true, distributedAt: new Date('2026-02-15'),
    },
    {
      id: cuid(), contentId: 'deriv-romans8-quotes-01', parentContentId: 'src-sermon-romans8-2026', sourceContentId: source1Id,
      derivativeType: 'social_quote', title: 'Romans 8 — Social Media Quotes',
      body: '1. "There is no condemnation — not reduced condemnation, not partial condemnation — NO condemnation for those in Christ Jesus."\n\n2. "The Spirit doesn\'t just visit us — He dwells in us. You are not a temporary home; you are His permanent address."\n\n3. "If God is for us, who can be against us? This isn\'t optimism — it\'s the settled reality of heaven."\n\n4. "Nothing in all creation can separate us from the love of God. Not your worst day. Not your deepest failure. Nothing."\n\n5. "We are more than conquerors — not because of our strength, but because of His love that holds us."',
      language: 'en', format: 'text', wordCount: 120, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: true, distributedAt: new Date('2026-02-15'),
    },
    {
      id: cuid(), contentId: 'deriv-romans8-thread-01', parentContentId: 'src-sermon-romans8-2026', sourceContentId: source1Id,
      derivativeType: 'thread_summary', title: 'Romans 8 Thread Summary',
      body: '1/ Romans 8 is the Mount Everest of Scripture. Paul takes us from "no condemnation" to "nothing can separate us." Here\'s the journey:\n\n2/ "There is now NO condemnation for those in Christ Jesus." Not reduced. Not pending review. None. Zero. This is where freedom begins.\n\n3/ Life in the Spirit vs. life in the flesh isn\'t about trying harder. It\'s about who\'s driving. The Spirit leads us where willpower never could.\n\n4/ "The Spirit helps us in our weakness." Even our prayers — God helps us pray when we don\'t know what to say.\n\n5/ Suffering is real. Paul doesn\'t sugarcoat it. But he says our present sufferings aren\'t worth comparing to the glory ahead.\n\n6/ All creation is groaning, waiting for the full revelation of God\'s children. Your redemption isn\'t just personal — it\'s cosmic.\n\n7/ "If God is for us, who can be against us?" This isn\'t naive optimism. It\'s the settled verdict of heaven over your life.\n\n8/ The final crescendo: NOTHING can separate us from God\'s love. Not death, not life, not angels, not demons. Nothing.\n\n9/ Read Romans 8 today. Let it wash over you. This is the foundation of everything we believe.',
      language: 'en', format: 'text', wordCount: 200, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'deriv-romans8-study-01', parentContentId: 'src-sermon-romans8-2026', sourceContentId: source1Id,
      derivativeType: 'study_guide', title: 'Romans 8 Study Guide',
      body: '# Romans 8 Study Guide\n\n## Key Passages\n- Romans 8:1-4 (No condemnation)\n- Romans 8:14-17 (Children of God)\n- Romans 8:26-28 (Spirit helps our weakness)\n- Romans 8:31-39 (Nothing separates us)\n\n## Discussion Questions\n1. What does "no condemnation" mean practically in your daily life?\n2. How do you distinguish between living by the flesh and living by the Spirit?\n3. In what areas of your life do you need to trust the Spirit\'s leading more?\n4. How does the promise of Romans 8:28 apply to current difficulties?\n5. What fears or circumstances tempt you to believe you\'re separated from God\'s love?\n\n## Reflection\n- Spend 5 minutes in silence, letting Romans 8:1 sink in.\n- Write down one area where you\'ve been living under condemnation.\n\n## Prayer Points\n- Thank God for the gift of no condemnation\n- Ask the Spirit to lead you in specific decisions this week\n- Pray for persecuted believers who need Romans 8:35-39',
      language: 'en', format: 'markdown', wordCount: 200, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'draft', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'deriv-romans8-newsletter-01', parentContentId: 'src-sermon-romans8-2026', sourceContentId: source1Id,
      derivativeType: 'newsletter_excerpt', title: 'Romans 8 Newsletter Excerpt',
      body: 'This week\'s sermon took us through Romans 8 — the chapter that declares our complete freedom in Christ. From "no condemnation" in verse 1 to "nothing can separate us" in verse 39, Paul paints a picture of a love so vast that no circumstance, power, or failure can break it. If you\'re carrying guilt today, hear this: the verdict is in, and it\'s "not guilty." Listen to the full message and let Romans 8 reshape how you see yourself and your God.',
      language: 'en', format: 'text', wordCount: 85, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: false,
    },
    // From Source 2 (Prayer Teaching)
    {
      id: cuid(), contentId: 'deriv-prayer-blog-01', parentContentId: 'src-teaching-prayer-2026', sourceContentId: source2Id,
      derivativeType: 'blog_post', title: 'The Practice of Persistent Prayer: What Jesus Taught in Luke 18',
      body: '# The Practice of Persistent Prayer\n\nJesus told a parable about a persistent widow who kept coming to an unjust judge until he granted her request. The lesson? "Will not God bring about justice for his chosen ones, who cry out to him day and night?" (Luke 18:7)\n\n## Why Persistent Prayer Matters\n\nPersistence in prayer is not about wearing God down...\n\n[Full 950-word blog post on persistent prayer, with practical tips for building a prayer habit.]',
      language: 'en', format: 'markdown', wordCount: 950, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'deriv-prayer-quotes-01', parentContentId: 'src-teaching-prayer-2026', sourceContentId: source2Id,
      derivativeType: 'social_quote', title: 'Prayer Teaching — Social Media Quotes',
      body: '1. "Persistent prayer isn\'t about wearing God down — it\'s about aligning your heart with His."\n\n2. "The widow didn\'t stop asking because she knew the judge could answer. How much more will our Father answer us?"\n\n3. "Prayer is not our last resort. It is our first response."',
      language: 'en', format: 'text', wordCount: 55, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: true, distributedAt: new Date('2026-02-16'),
    },
    // From Source 3 (Persecution Article)
    {
      id: cuid(), contentId: 'deriv-persecution-blog-01', parentContentId: 'src-article-persecution-2026', sourceContentId: source3Id,
      derivativeType: 'blog_post', title: 'Standing Firm: Hope for Believers Facing Persecution',
      body: '# Standing Firm: Hope for Believers Facing Persecution\n\nAcross the globe, millions of believers face daily pressure for their faith...\n\n[Full 1,000-word adaptation of the persecution encouragement article, formatted for blog distribution.]',
      language: 'en', format: 'markdown', wordCount: 1000, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'draft', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'deriv-persecution-quotes-01', parentContentId: 'src-article-persecution-2026', sourceContentId: source3Id,
      derivativeType: 'social_quote', title: 'Persecution Article — Social Media Quotes',
      body: '1. "Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven." — Matthew 5:10\n\n2. "The church has always grown strongest under pressure. Persecution scatters seeds, not destroys them."',
      language: 'en', format: 'text', wordCount: 40, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001',
      status: 'ready', sentToDistribution: false,
    },
  ]

  for (const deriv of derivatives) {
    await prisma.derivative.upsert({
      where: { contentId: deriv.contentId },
      update: {},
      create: deriv,
    })
  }
  console.log(`  ✓ ${derivatives.length} derivatives`)

  // ── TRANSLATIONS ──
  const translations = [
    // Hindi translations
    {
      id: cuid(), contentId: 'trans-romans8-blog-hi', parentContentId: 'deriv-romans8-blog-01',
      derivativeId: derivatives[0].id, sourceLanguage: 'en', targetLanguage: 'hi',
      title: 'रोमियों 8: मसीह में हमारी स्वतंत्रता की नींव',
      body: '# रोमियों 8: मसीह में हमारी स्वतंत्रता की नींव\n\nपौलुस का रोमियों को पत्र अध्याय 8 में अपने चरम पर पहुँचता है, जहाँ वह पवित्रशास्त्र का सबसे मुक्तिदायक सत्य घोषित करता है...\n\n[पूर्ण हिंदी अनुवाद]',
      status: 'approved', reviewPass: 2, reviewerNotes: 'Reviewed by local Hindi speaker. Theological terms verified.',
      isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: true, distributedAt: new Date('2026-02-16'),
    },
    {
      id: cuid(), contentId: 'trans-romans8-quotes-hi', parentContentId: 'deriv-romans8-quotes-01',
      derivativeId: derivatives[1].id, sourceLanguage: 'en', targetLanguage: 'hi',
      title: 'रोमियों 8 — सोशल मीडिया उद्धरण',
      body: '1. "कोई दण्ड नहीं — कम दण्ड नहीं, आंशिक दण्ड नहीं — मसीह यीशु में जो हैं उनके लिए कोई दण्ड नहीं।"\n\n2. "आत्मा हमसे केवल मिलने नहीं आता — वह हममें वास करता है।"',
      status: 'approved', reviewPass: 2, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: true, distributedAt: new Date('2026-02-16'),
    },
    // Bengali translations
    {
      id: cuid(), contentId: 'trans-romans8-blog-bn', parentContentId: 'deriv-romans8-blog-01',
      derivativeId: derivatives[0].id, sourceLanguage: 'en', targetLanguage: 'bn',
      title: 'রোমীয় ৮: খ্রীষ্টে আমাদের স্বাধীনতার ভিত্তি',
      body: '# রোমীয় ৮: খ্রীষ্টে আমাদের স্বাধীনতার ভিত্তি\n\nপৌলের রোমীয়দের প্রতি পত্র অধ্যায় ৮-এ তার শীর্ষে পৌঁছায়...\n\n[সম্পূর্ণ বাংলা অনুবাদ]',
      status: 'ai_draft', reviewPass: 1, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'trans-romans8-quotes-bn', parentContentId: 'deriv-romans8-quotes-01',
      derivativeId: derivatives[1].id, sourceLanguage: 'en', targetLanguage: 'bn',
      title: 'রোমীয় ৮ — সোশ্যাল মিডিয়া উদ্ধৃতি',
      body: '1. "কোনো দণ্ডাজ্ঞা নেই — কম দণ্ডাজ্ঞা নয়, আংশিক দণ্ডাজ্ঞা নয় — খ্রীষ্ট যীশুতে যারা আছেন তাদের জন্য কোনো দণ্ডাজ্ঞা নেই।"',
      status: 'review_pending', reviewPass: 1, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
    // Maithili translations
    {
      id: cuid(), contentId: 'trans-romans8-blog-mai', parentContentId: 'deriv-romans8-blog-01',
      derivativeId: derivatives[0].id, sourceLanguage: 'en', targetLanguage: 'mai',
      title: 'रोमी 8: मसीह मे हमर स्वतंत्रताक नींव',
      body: '# रोमी 8: मसीह मे हमर स्वतंत्रताक नींव\n\nपौलुसक रोमी कें पत्र अध्याय 8 मे अपन चरम पर पहुँचैत अछि...\n\n[पूर्ण मैथिली अनुवाद]',
      status: 'ai_draft', reviewPass: 1, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
    // Prayer teaching translations
    {
      id: cuid(), contentId: 'trans-prayer-blog-hi', parentContentId: 'deriv-prayer-blog-01',
      derivativeId: derivatives[5].id, sourceLanguage: 'en', targetLanguage: 'hi',
      title: 'लगातार प्रार्थना का अभ्यास',
      body: '# लगातार प्रार्थना का अभ्यास\n\nयीशु ने एक दृष्टान्त सुनाया एक लगातार विधवा के बारे में...\n\n[पूर्ण हिंदी अनुवाद]',
      status: 'ai_draft', reviewPass: 1, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'trans-prayer-quotes-hi', parentContentId: 'deriv-prayer-quotes-01',
      derivativeId: derivatives[6].id, sourceLanguage: 'en', targetLanguage: 'hi',
      title: 'प्रार्थना शिक्षा — सोशल मीडिया उद्धरण',
      body: '1. "लगातार प्रार्थना भगवान को थकाने के बारे में नहीं है — यह आपके हृदय को उनकी इच्छा के अनुरूप करने के बारे में है।"',
      status: 'reviewed', reviewPass: 2, reviewerNotes: 'Good translation. Minor adjustment to "भगवान" → "परमेश्वर" for Christian context.',
      isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
    // Persecution article translations
    {
      id: cuid(), contentId: 'trans-persecution-blog-hi', parentContentId: 'deriv-persecution-blog-01',
      derivativeId: derivatives[7].id, sourceLanguage: 'en', targetLanguage: 'hi',
      title: 'दृढ़ बने रहना: सताव का सामना कर रहे विश्वासियों के लिए आशा',
      body: '# दृढ़ बने रहना\n\nदुनिया भर में लाखों विश्वासी अपने विश्वास के लिए दैनिक दबाव का सामना कर रहे हैं...\n\n[पूर्ण हिंदी अनुवाद]',
      status: 'ai_draft', reviewPass: 1, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
    {
      id: cuid(), contentId: 'trans-persecution-blog-bn', parentContentId: 'deriv-persecution-blog-01',
      derivativeId: derivatives[7].id, sourceLanguage: 'en', targetLanguage: 'bn',
      title: 'দৃঢ় থাকা: নিপীড়নের মুখে বিশ্বাসীদের জন্য আশা',
      body: '# দৃঢ় থাকা\n\nবিশ্বজুড়ে লক্ষ লক্ষ বিশ্বাসী তাদের বিশ্বাসের জন্য দৈনিক চাপের সম্মুখীন হচ্ছেন...\n\n[সম্পূর্ণ বাংলা অনুবাদ]',
      status: 'ai_draft', reviewPass: 1, isAiGenerated: true, aiModel: 'claude-haiku-4-5-20251001', sentToDistribution: false,
    },
  ]

  for (const trans of translations) {
    await prisma.translation.upsert({
      where: { contentId: trans.contentId },
      update: {},
      create: trans,
    })
  }
  console.log(`  ✓ ${translations.length} translations`)

  // ── PROCESSING JOBS ──
  const now = new Date()
  const jobs = [
    {
      id: cuid(), sourceContentId: source1Id, jobType: 'transcription', status: 'completed', priority: 1, progress: 100,
      inputData: JSON.stringify({ mediaType: 'video', duration: 2520 }),
      outputData: JSON.stringify({ wordCount: 6300, language: 'en', engine: 'elevenlabs-scribe' }),
      startedAt: new Date(now.getTime() - 86400000 * 3), completedAt: new Date(now.getTime() - 86400000 * 3 + 180000),
    },
    {
      id: cuid(), sourceContentId: source1Id, jobType: 'batch_repurpose', status: 'completed', priority: 2, progress: 100,
      inputData: JSON.stringify({ derivativeTypes: ['blog_post', 'social_quote', 'thread_summary', 'study_guide', 'newsletter_excerpt'] }),
      outputData: JSON.stringify({ derivativesCreated: 5, aiModel: 'claude-haiku-4-5-20251001' }),
      startedAt: new Date(now.getTime() - 86400000 * 2), completedAt: new Date(now.getTime() - 86400000 * 2 + 120000),
    },
    {
      id: cuid(), sourceContentId: source2Id, jobType: 'transcription', status: 'completed', priority: 1, progress: 100,
      inputData: JSON.stringify({ mediaType: 'audio', duration: 1800 }),
      outputData: JSON.stringify({ wordCount: 4500, language: 'en', engine: 'elevenlabs-scribe' }),
      startedAt: new Date(now.getTime() - 86400000 * 2), completedAt: new Date(now.getTime() - 86400000 * 2 + 120000),
    },
    {
      id: cuid(), sourceContentId: null, jobType: 'translation', status: 'processing', priority: 3, progress: 45,
      inputData: JSON.stringify({ derivativeIds: ['deriv-romans8-blog-01'], targetLanguages: ['hi', 'bn', 'mai'] }),
      startedAt: new Date(now.getTime() - 300000),
    },
    {
      id: cuid(), sourceContentId: source3Id, jobType: 'derivative_generation', status: 'queued', priority: 5, progress: 0,
      inputData: JSON.stringify({ derivativeTypes: ['study_guide', 'newsletter_excerpt', 'quote_graphic'] }),
    },
  ]

  for (const job of jobs) {
    await prisma.processingJob.create({ data: job })
  }
  console.log(`  ✓ ${jobs.length} processing jobs`)

  // ── ALERTS ──
  const alerts = [
    {
      id: cuid(), severity: 'info', category: 'distribution_sync',
      message: 'Romans 8 blog post and quotes successfully sent to Distribution Dashboard',
      details: JSON.stringify({ contentIds: ['deriv-romans8-blog-01', 'deriv-romans8-quotes-01'], distributedAt: '2026-02-15' }),
      isRead: true, isResolved: true, resolvedAt: new Date('2026-02-15'),
    },
    {
      id: cuid(), severity: 'warning', category: 'translation_error',
      message: 'Maithili translation may need theological review — "mai" is an underrepresented language in training data',
      details: JSON.stringify({ language: 'mai', contentId: 'trans-romans8-blog-mai', confidence: 'medium' }),
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
      sourcesIngested: 2, derivativesGenerated: 7, translationsCompleted: 2,
      jobsProcessed: 4, jobsFailed: 0, aiTokensUsed: 45000, scribeMinutes: 72.0, imagesGenerated: 0,
      sentToDistribution: 4, successRate: 100.0,
      derivativeBreakdown: JSON.stringify({ blog_post: 2, social_quote: 2, thread_summary: 1, study_guide: 1, newsletter_excerpt: 1 }),
      languageBreakdown: JSON.stringify({ hi: 2, bn: 0, mai: 0 }),
    },
    {
      id: cuid(), date: new Date('2026-02-16'),
      sourcesIngested: 1, derivativesGenerated: 2, translationsCompleted: 5,
      jobsProcessed: 3, jobsFailed: 0, aiTokensUsed: 32000, scribeMinutes: 30.0, imagesGenerated: 0,
      sentToDistribution: 3, successRate: 100.0,
      derivativeBreakdown: JSON.stringify({ blog_post: 1, social_quote: 1 }),
      languageBreakdown: JSON.stringify({ hi: 3, bn: 2, mai: 0 }),
    },
  ]

  for (const metric of metrics) {
    await prisma.repurposingMetric.upsert({
      where: { date: metric.date },
      update: {},
      create: metric,
    })
  }
  console.log(`  ✓ ${metrics.length} daily metrics`)

  // ── PABBLY EVENTS ──
  const events = [
    {
      id: cuid(), direction: 'inbound', workflowName: 'ROUTE-SourceContent-to-Repurposing',
      eventType: 'source_ingested', status: 'received',
      payload: JSON.stringify({ contentId: 'src-sermon-romans8-2026', title: 'Romans 8 Sermon', driveFileId: 'gdrive-file-id-001' }),
      relatedContentId: 'src-sermon-romans8-2026',
    },
    {
      id: cuid(), direction: 'outbound', workflowName: 'ROUTE-Derivatives-to-Distribution',
      eventType: 'derivative_created', status: 'sent',
      payload: JSON.stringify({ contentId: 'deriv-romans8-blog-01', derivativeType: 'blog_post', language: 'en' }),
      relatedContentId: 'deriv-romans8-blog-01',
    },
  ]

  for (const event of events) {
    await prisma.pabblyEvent.create({ data: event })
  }
  console.log(`  ✓ ${events.length} Pabbly events`)

  // ── DERIVATIVE QUEUE ──
  const queues = [
    {
      id: cuid(), sourceContentId: source3Id,
      derivativeTypes: JSON.stringify(['blog_post', 'social_quote', 'study_guide', 'newsletter_excerpt', 'quote_graphic']),
      languages: JSON.stringify(['hi', 'bn', 'mai']),
      status: 'pending', totalExpected: 20, totalCompleted: 0, totalFailed: 0,
    },
  ]

  for (const queue of queues) {
    await prisma.derivativeQueue.create({ data: queue })
  }
  console.log(`  ✓ ${queues.length} derivative queues`)

  console.log('\nSeed complete!')
  console.log('  Sources: 3 (1 sermon video, 1 teaching audio, 1 article)')
  console.log('  Derivatives: 9 across 5 types')
  console.log('  Translations: 9 (Hindi, Bengali, Maithili)')
  console.log('  Languages: Hindi, Bengali, Maithili')
  console.log('  Templates: 8 (one per derivative type)')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
