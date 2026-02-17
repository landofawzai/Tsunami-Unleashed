// Content Helpers
// ContentId generation, status validation, and utility functions

const VALID_STATUSES = [
  'planning', 'drafting', 'recording', 'editing',
  'review', 'approved', 'finalized',
  'sent_to_repurposing', 'archived',
] as const

const VALID_CONTENT_TYPES = ['sermon', 'teaching', 'article', 'study_guide', 'testimony'] as const
const VALID_MEDIA_TYPES = ['video', 'audio', 'text', 'mixed'] as const

export type ContentStatus = typeof VALID_STATUSES[number]

/**
 * Generate a unique contentId: SRC-{YYYYMMDD}-{random6}
 */
export function generateContentId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8)
  return `SRC-${date}-${random}`
}

/**
 * Validate content status value
 */
export function isValidStatus(status: string): status is ContentStatus {
  return (VALID_STATUSES as readonly string[]).includes(status)
}

/**
 * Validate content type
 */
export function isValidContentType(type: string): boolean {
  return (VALID_CONTENT_TYPES as readonly string[]).includes(type)
}

/**
 * Validate media type
 */
export function isValidMediaType(type: string): boolean {
  return (VALID_MEDIA_TYPES as readonly string[]).includes(type)
}

/**
 * Check if status transition is allowed
 */
export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
  const transitions: Record<string, string[]> = {
    planning: ['drafting', 'recording', 'archived'],
    drafting: ['recording', 'editing', 'review', 'archived'],
    recording: ['editing', 'review', 'archived'],
    editing: ['review', 'approved', 'archived'],
    review: ['approved', 'drafting', 'editing', 'archived'],
    approved: ['finalized', 'review', 'archived'],
    finalized: ['sent_to_repurposing', 'archived'],
    sent_to_repurposing: ['archived'],
    archived: ['planning'],
  }

  const allowed = transitions[currentStatus]
  if (!allowed) return false
  return allowed.includes(targetStatus)
}
