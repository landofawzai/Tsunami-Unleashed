// Transcription Engine — ElevenLabs Scribe API Integration
// 96.7% accuracy, better Hindi/Bengali support, fewer hallucinations than Whisper

interface TranscriptionResult {
  text: string
  language: string
  durationSeconds: number
  wordCount: number
  success: boolean
  error?: string
}

/**
 * Transcribe audio/video using ElevenLabs Scribe API
 * Falls back gracefully if API key is not configured
 */
export async function transcribeAudio(
  audioBuffer: Uint8Array,
  fileName: string,
  language?: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.warn('ELEVENLABS_API_KEY not set — cannot transcribe')
    return {
      text: '',
      language: language || 'en',
      durationSeconds: 0,
      wordCount: 0,
      success: false,
      error: 'ElevenLabs API key not configured',
    }
  }

  try {
    const formData = new FormData()
    const blob = new Blob([audioBuffer.buffer as ArrayBuffer], { type: getMimeType(fileName) })
    formData.append('file', blob, fileName)
    formData.append('model_id', 'scribe_v1')
    if (language) {
      formData.append('language_code', language)
    }

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ElevenLabs Scribe error: ${response.status} ${errorText}`)
      return {
        text: '',
        language: language || 'en',
        durationSeconds: 0,
        wordCount: 0,
        success: false,
        error: `Scribe API returned ${response.status}: ${errorText}`,
      }
    }

    const data = await response.json()
    const text = data.text || ''
    const words = text.split(/\s+/).filter((w: string) => w.length > 0)

    return {
      text,
      language: data.language_code || language || 'en',
      durationSeconds: data.audio_duration || 0,
      wordCount: words.length,
      success: true,
    }
  } catch (error) {
    console.error('Transcription failed:', error)
    return {
      text: '',
      language: language || 'en',
      durationSeconds: 0,
      wordCount: 0,
      success: false,
      error: `Transcription failed: ${error}`,
    }
  }
}

/**
 * Estimate transcription cost based on duration
 * ElevenLabs Scribe: ~$0.40/hour ($0.0067/min)
 */
export function estimateTranscriptionCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  return Math.ceil(minutes * 0.0067 * 100) / 100 // Round up to nearest cent
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
  }
  return mimeTypes[ext || ''] || 'audio/mpeg'
}
