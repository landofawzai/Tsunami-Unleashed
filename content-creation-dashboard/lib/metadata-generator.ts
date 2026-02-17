// Metadata Generator
// Builds .meta.json sidecar data from ContentItem

interface ContentItemData {
  contentId: string
  title: string
  contentType: string
  mediaType: string
  language: string
  tags?: string | null
  targetLanguages?: string | null
  driveFileId?: string | null
  durationSeconds?: number | null
  wordCount?: number | null
}

interface MetadataSidecar {
  contentId: string
  title: string
  contentType: string
  language: string
  sourceFile: string | null
  mimeType: string | null
  createdBy: string
  createdAt: string
  parentContentId: null
  isDerivative: false
  tags: string[]
  targetLanguages: string[]
  flags: {
    readyForRepurposing: boolean
    readyForTranslation: boolean
    readyForDistribution: boolean
    highValueForSyndication: boolean
    needsHumanReview: boolean
  }
  processingHistory: Array<{
    pillar: string
    action: string
    timestamp: string
  }>
}

/**
 * Generate .meta.json sidecar data from a ContentItem
 */
export function generateMetadata(item: ContentItemData, isFinalized: boolean = false): MetadataSidecar {
  let tags: string[] = []
  try {
    tags = item.tags ? JSON.parse(item.tags) : []
  } catch { /* ignore */ }

  let targetLanguages: string[] = []
  try {
    targetLanguages = item.targetLanguages ? JSON.parse(item.targetLanguages) : []
  } catch { /* ignore */ }

  const mimeTypeMap: Record<string, string> = {
    video: 'video/mp4',
    audio: 'audio/mpeg',
    text: 'text/plain',
    mixed: 'application/octet-stream',
  }

  return {
    contentId: item.contentId,
    title: item.title,
    contentType: item.contentType,
    language: item.language,
    sourceFile: item.driveFileId || null,
    mimeType: mimeTypeMap[item.mediaType] || null,
    createdBy: 'content_creation',
    createdAt: new Date().toISOString(),
    parentContentId: null,
    isDerivative: false,
    tags,
    targetLanguages,
    flags: {
      readyForRepurposing: isFinalized,
      readyForTranslation: isFinalized,
      readyForDistribution: false,
      highValueForSyndication: tags.includes('sunday-sermon') || tags.includes('persecution'),
      needsHumanReview: false,
    },
    processingHistory: [
      {
        pillar: 'content_creation',
        action: isFinalized ? 'finalized' : 'created',
        timestamp: new Date().toISOString(),
      },
    ],
  }
}
