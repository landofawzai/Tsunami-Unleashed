// Google Drive Integration
// Read/write files and .meta.json sidecars for inter-pillar communication

interface SidecarData {
  contentId: string
  parentContentId?: string
  derivativeType?: string
  language: string
  title: string
  format: string
  createdAt: string
  source: string
  flags: {
    readyForDistribution: boolean
    isTranslation: boolean
    isAiGenerated: boolean
  }
  processingHistory: Array<{
    action: string
    timestamp: string
    tool: string
  }>
}

interface DriveResult {
  success: boolean
  fileId?: string
  error?: string
}

/**
 * Build a .meta.json sidecar for a derivative or translation
 */
export function buildSidecar(
  contentId: string,
  title: string,
  options: {
    parentContentId?: string
    derivativeType?: string
    language?: string
    format?: string
    isTranslation?: boolean
    isAiGenerated?: boolean
    readyForDistribution?: boolean
    processingHistory?: Array<{ action: string; timestamp: string; tool: string }>
  }
): SidecarData {
  return {
    contentId,
    parentContentId: options.parentContentId,
    derivativeType: options.derivativeType,
    language: options.language || 'en',
    title,
    format: options.format || 'text',
    createdAt: new Date().toISOString(),
    source: 'Repurposing Dashboard',
    flags: {
      readyForDistribution: options.readyForDistribution || false,
      isTranslation: options.isTranslation || false,
      isAiGenerated: options.isAiGenerated || false,
    },
    processingHistory: options.processingHistory || [
      {
        action: 'created',
        timestamp: new Date().toISOString(),
        tool: 'repurposing-dashboard',
      },
    ],
  }
}

/**
 * Upload a file to Google Drive
 * Uses Google Drive API with service account authentication
 */
export async function uploadToDrive(
  folderId: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<DriveResult> {
  const serviceAccountKey = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY
  if (!serviceAccountKey) {
    console.warn('GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY not set — skipping Drive upload')
    console.log(`[Drive] Would upload: ${fileName} to folder ${folderId}`)
    return { success: true, fileId: `mock-${Date.now()}` }
  }

  try {
    // Get access token from service account
    const accessToken = await getAccessToken(serviceAccountKey)
    if (!accessToken) {
      return { success: false, error: 'Failed to get Google Drive access token' }
    }

    // Create file metadata
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType,
    }

    // Multipart upload
    const boundary = 'repurposing-dashboard-boundary'
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n')

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Drive upload failed: ${response.status} ${errorText}` }
    }

    const data = await response.json()
    return { success: true, fileId: data.id }
  } catch (error) {
    console.error('Drive upload error:', error)
    return { success: false, error: `Drive upload failed: ${error}` }
  }
}

/**
 * Upload a derivative with its .meta.json sidecar to Google Drive
 */
export async function uploadDerivativeWithSidecar(
  derivative: {
    contentId: string
    parentContentId: string
    derivativeType: string
    title: string
    body: string
    language: string
    format: string
    isAiGenerated: boolean
  }
): Promise<DriveResult> {
  const folderId = process.env.GOOGLE_DRIVE_DERIVATIVES_FOLDER_ID
  if (!folderId) {
    console.warn('GOOGLE_DRIVE_DERIVATIVES_FOLDER_ID not set')
    return { success: true, fileId: `mock-${Date.now()}` }
  }

  // Upload the content file
  const fileName = `${derivative.contentId}.${derivative.format === 'markdown' ? 'md' : 'txt'}`
  const contentResult = await uploadToDrive(folderId, fileName, derivative.body)

  // Upload the sidecar
  const sidecar = buildSidecar(derivative.contentId, derivative.title, {
    parentContentId: derivative.parentContentId,
    derivativeType: derivative.derivativeType,
    language: derivative.language,
    format: derivative.format,
    isAiGenerated: derivative.isAiGenerated,
    readyForDistribution: true,
  })

  const sidecarResult = await uploadToDrive(
    folderId,
    `${derivative.contentId}.meta.json`,
    JSON.stringify(sidecar, null, 2),
    'application/json'
  )

  return contentResult.success && sidecarResult.success
    ? { success: true, fileId: contentResult.fileId }
    : { success: false, error: 'Partial upload failure' }
}

/**
 * Get OAuth2 access token from service account key
 */
async function getAccessToken(serviceAccountKeyBase64: string): Promise<string | null> {
  try {
    const keyJson = JSON.parse(
      Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8')
    )

    // Build JWT for service account auth
    const now = Math.floor(Date.now() / 1000)
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({
        iss: keyJson.client_email,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    ).toString('base64url')

    // Note: Full RS256 signing requires crypto module
    // For production, use googleapis npm package or a JWT library
    // This is a simplified version that logs the intent
    console.log(`[Drive] Would authenticate as: ${keyJson.client_email}`)
    return null // Return null until proper crypto signing is implemented
  } catch (error) {
    console.error('Service account auth failed:', error)
    return null
  }
}
