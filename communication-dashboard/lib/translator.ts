// Translator - AI-powered message translation
// Uses Claude Haiku for cost-efficient translation with caching

// In-memory cache: key = `${campaignId}-${language}`, value = translated text
const translationCache = new Map<string, string>()

// ISO 639-1 language names for better AI prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
  sw: 'Swahili',
  ar: 'Arabic',
  hi: 'Hindi',
  ta: 'Tamil',
  ur: 'Urdu',
  si: 'Sinhala',
  de: 'German',
  nl: 'Dutch',
  ro: 'Romanian',
  uk: 'Ukrainian',
  tl: 'Tagalog/Filipino',
  id: 'Indonesian',
  vi: 'Vietnamese',
  th: 'Thai',
  ko: 'Korean',
  ja: 'Japanese',
  am: 'Amharic',
  tr: 'Turkish',
}

/**
 * Translate a message from one language to another using AI
 * Returns the translated text or the original if translation fails
 */
export async function translateMessage(
  body: string,
  fromLang: string,
  toLang: string,
  cacheKey?: string
): Promise<{ text: string; isTranslated: boolean }> {
  // No translation needed if same language
  if (fromLang === toLang) {
    return { text: body, isTranslated: false }
  }

  // Check cache first
  if (cacheKey) {
    const cached = translationCache.get(`${cacheKey}-${toLang}`)
    if (cached) {
      return { text: cached, isTranslated: true }
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — cannot translate')
    return { text: body, isTranslated: false }
  }

  const fromName = LANGUAGE_NAMES[fromLang] || fromLang
  const toName = LANGUAGE_NAMES[toLang] || toLang

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: `You are a translator for a Christian ministry. Translate the following message from ${fromName} to ${toName}. Maintain the original tone, meaning, and any spiritual/biblical references. Preserve formatting (bold markers, line breaks, bullet points). Return ONLY the translated text, no explanation or notes.`,
        messages: [
          {
            role: 'user',
            content: body,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error(`Translation API error: ${response.status}`)
      return { text: body, isTranslated: false }
    }

    const data = await response.json()
    const translated = data.content?.[0]?.text?.trim()

    if (!translated) {
      return { text: body, isTranslated: false }
    }

    // Cache the result
    if (cacheKey) {
      translationCache.set(`${cacheKey}-${toLang}`, translated)
    }

    return { text: translated, isTranslated: true }
  } catch (error) {
    console.error(`Translation to ${toName} failed:`, error)
    return { text: body, isTranslated: false }
  }
}

/**
 * Translate a message for a set of contacts, batching by unique language
 * Returns a map of language → translated text
 */
export async function translateForContacts(
  body: string,
  sourceLang: string,
  contactLanguages: string[],
  cacheKey?: string
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // Get unique languages (excluding source language)
  const uniqueLanguages = [...new Set(contactLanguages)].filter(
    (lang) => lang !== sourceLang
  )

  // Source language maps to original body
  results.set(sourceLang, body)

  // Translate to each unique language in parallel
  const translations = await Promise.all(
    uniqueLanguages.map(async (lang) => {
      const result = await translateMessage(body, sourceLang, lang, cacheKey)
      return { lang, text: result.text }
    })
  )

  for (const { lang, text } of translations) {
    results.set(lang, text)
  }

  return results
}

/**
 * Clear the translation cache (useful between campaigns)
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

/**
 * Get a human-readable language name from ISO code
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase()
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_NAMES)
}
