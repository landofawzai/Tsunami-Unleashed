// Image Generator — FAL.AI Integration
// Generates quote graphic images using FLUX/Recraft models

interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  error?: string
}

/**
 * Generate a quote graphic image using FAL.AI
 * Takes a quote text and generates a visually appealing image with text overlay
 */
export async function generateQuoteImage(
  quoteText: string,
  options?: {
    style?: string
    backgroundColor?: string
    model?: string
  }
): Promise<ImageGenerationResult> {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) {
    console.warn('FAL_API_KEY not set — cannot generate quote graphics')
    return {
      success: false,
      error: 'FAL.AI API key not configured',
    }
  }

  const model = options?.model || process.env.FAL_MODEL || 'fal-ai/flux/schnell'
  const style = options?.style || 'minimalist, elegant'

  // Build the image generation prompt
  const prompt = buildQuoteImagePrompt(quoteText, style)

  try {
    const response = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FAL.AI error: ${response.status} ${errorText}`)
      return {
        success: false,
        error: `FAL.AI returned ${response.status}: ${errorText}`,
      }
    }

    const data = await response.json()
    const imageUrl = data.images?.[0]?.url

    if (!imageUrl) {
      return {
        success: false,
        error: 'FAL.AI returned no image URL',
      }
    }

    return { success: true, imageUrl }
  } catch (error) {
    console.error('Image generation failed:', error)
    return {
      success: false,
      error: `Image generation failed: ${error}`,
    }
  }
}

/**
 * Build a prompt for generating a visually appealing quote graphic
 */
function buildQuoteImagePrompt(quoteText: string, style: string): string {
  return `Beautiful ${style} quote graphic background for a Christian ministry.
Serene, uplifting atmosphere. Soft gradient background with subtle light effects.
Clean and modern design suitable for social media sharing.
The image should evoke hope, peace, and spiritual depth.
No text in the image - just the background design.
Style: professional, warm, inviting, suitable for overlaying white text.
Theme inspired by: "${quoteText.substring(0, 100)}"`
}

/**
 * Estimate image generation cost
 * FAL.AI: ~$0.01-$0.05 per image depending on model
 */
export function estimateImageCost(model?: string): number {
  const costs: Record<string, number> = {
    'fal-ai/flux/schnell': 0.01,
    'fal-ai/flux/dev': 0.025,
    'fal-ai/recraft-v3': 0.04,
  }
  return costs[model || 'fal-ai/flux/schnell'] || 0.03
}
