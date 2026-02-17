// Media Processor — FFmpeg CLI Operations
// Handles audio extraction, format conversion, and duration detection

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const FFMPEG_TIMEOUT = 300000 // 5 minutes max per operation

interface MediaInfo {
  durationSeconds: number
  format: string
  hasAudio: boolean
  hasVideo: boolean
  success: boolean
  error?: string
}

interface ProcessResult {
  outputPath: string
  success: boolean
  error?: string
}

/**
 * Extract audio track from video file
 * Outputs as MP3 for Scribe compatibility
 */
export async function extractAudioFromVideo(
  inputPath: string,
  outputPath: string
): Promise<ProcessResult> {
  try {
    await execAsync(
      `ffmpeg -i "${inputPath}" -vn -acodec libmp3lame -q:a 2 -y "${outputPath}"`,
      { timeout: FFMPEG_TIMEOUT }
    )
    return { outputPath, success: true }
  } catch (error) {
    console.error('FFmpeg audio extraction failed:', error)
    return {
      outputPath,
      success: false,
      error: `Audio extraction failed: ${error}`,
    }
  }
}

/**
 * Get media file info (duration, format, tracks)
 */
export async function getMediaInfo(filePath: string): Promise<MediaInfo> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      { timeout: 30000 }
    )

    const info = JSON.parse(stdout)
    const duration = parseFloat(info.format?.duration || '0')
    const streams = info.streams || []
    const hasAudio = streams.some((s: { codec_type: string }) => s.codec_type === 'audio')
    const hasVideo = streams.some((s: { codec_type: string }) => s.codec_type === 'video')

    return {
      durationSeconds: Math.round(duration),
      format: info.format?.format_name || 'unknown',
      hasAudio,
      hasVideo,
      success: true,
    }
  } catch (error) {
    console.error('FFprobe failed:', error)
    return {
      durationSeconds: 0,
      format: 'unknown',
      hasAudio: false,
      hasVideo: false,
      success: false,
      error: `Media info failed: ${error}`,
    }
  }
}

/**
 * Convert audio to a different format
 */
export async function convertAudioFormat(
  inputPath: string,
  outputPath: string,
  format: 'mp3' | 'wav' | 'ogg'
): Promise<ProcessResult> {
  const codecMap = { mp3: 'libmp3lame', wav: 'pcm_s16le', ogg: 'libvorbis' }
  const codec = codecMap[format]

  try {
    await execAsync(
      `ffmpeg -i "${inputPath}" -acodec ${codec} -y "${outputPath}"`,
      { timeout: FFMPEG_TIMEOUT }
    )
    return { outputPath, success: true }
  } catch (error) {
    console.error('Audio conversion failed:', error)
    return {
      outputPath,
      success: false,
      error: `Audio conversion failed: ${error}`,
    }
  }
}

/**
 * Get media duration in seconds
 */
export async function getMediaDuration(filePath: string): Promise<number> {
  const info = await getMediaInfo(filePath)
  return info.durationSeconds
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 })
    return true
  } catch {
    return false
  }
}
