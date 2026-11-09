export const runtime = 'nodejs'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { uploadToR2, downloadFromR2, deleteR2Key } from '@/lib/r2'
import { writeFile, unlink, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'

const MAX_DURATION_SECONDS = 30
const MAX_INPUT_SIZE = 200 * 1024 * 1024 // 200 MB
const ALLOWED_TYPES = ['mp4', 'quicktime', 'webm', 'avi', 'x-msvideo', 'mov']

// ffmpeg helpers — require() inside functions 讓 Next.js build 不分析這些模組
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFfmpeg(): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Ffmpeg = require('fluent-ffmpeg')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegPath: string = require('@ffmpeg-installer/ffmpeg').path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffprobePath: string = require('@ffprobe-installer/ffprobe').path
  Ffmpeg.setFfmpegPath(ffmpegPath)
  Ffmpeg.setFfprobePath(ffprobePath)
  return Ffmpeg
}

function getDuration(filePath: string): Promise<number> {
  const Ffmpeg = getFfmpeg()
  return new Promise((resolve, reject) => {
    Ffmpeg.ffprobe(filePath, (err: Error, meta: { format: { duration?: number } }) => {
      if (err) reject(err)
      else resolve(meta.format.duration ?? 0)
    })
  })
}

function compressVideo(input: string, output: string): Promise<void> {
  const Ffmpeg = getFfmpeg()
  return new Promise((resolve, reject) => {
    Ffmpeg(input)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-crf 28', '-preset fast', '-movflags +faststart', '-vf scale=-2:720'])
      .save(output)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
  })
}

function extractThumbnail(input: string, output: string): Promise<void> {
  const Ffmpeg = getFfmpeg()
  return new Promise((resolve, reject) => {
    Ffmpeg(input)
      .seekInput('0.5')
      .frames(1)
      .output(output)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run()
  })
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken) : null
  if (!auth) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const tempId = randomBytes(8).toString('hex')
  const tempDir = join(tmpdir(), `vid-${tempId}`)
  const inputPath = join(tempDir, 'input.mp4')
  const outputPath = join(tempDir, 'output.mp4')
  const thumbPath = join(tempDir, 'thumb.jpg')

  // 大影片由瀏覽器先直傳 R2（tmp-video/），這裡只收 key
  let tempKey: string | null = null

  try {
    let file: File | null = null
    let mimeType = 'video/mp4'
    if (request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json().catch(() => null)
      if (typeof body?.key !== 'string' || !/^tmp-video\/[\w.-]+$/.test(body.key)) {
        return NextResponse.json({ error: '請選擇影片' }, { status: 400 })
      }
      tempKey = body.key
      mimeType = String(body.contentType || mimeType)
    } else {
      const formData = await request.formData()
      file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ error: '請選擇影片' }, { status: 400 })
      mimeType = file.type || mimeType
    }

    if (!ALLOWED_TYPES.some(t => mimeType.includes(t))) {
      return NextResponse.json({ error: '只支援 MP4、MOV、WebM、AVI 格式' }, { status: 400 })
    }
    if (file && file.size > MAX_INPUT_SIZE) {
      return NextResponse.json({ error: '影片大小不能超過 200MB' }, { status: 400 })
    }

    await mkdir(tempDir, { recursive: true })
    const buffer = tempKey ? await downloadFromR2(tempKey) : Buffer.from(await file!.arrayBuffer())
    if (buffer.length > MAX_INPUT_SIZE) {
      return NextResponse.json({ error: '影片大小不能超過 200MB' }, { status: 400 })
    }
    await writeFile(inputPath, buffer)

    const duration = await getDuration(inputPath)
    if (duration > MAX_DURATION_SECONDS) {
      return NextResponse.json(
        { error: `影片長度不能超過 ${MAX_DURATION_SECONDS} 秒（目前 ${Math.round(duration)} 秒）` },
        { status: 400 }
      )
    }

    await compressVideo(inputPath, outputPath)
    await extractThumbnail(inputPath, thumbPath)

    const [videoBuffer, thumbBuffer] = await Promise.all([
      readFile(outputPath),
      readFile(thumbPath),
    ])

    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadToR2(videoBuffer, `${tempId}.mp4`, 'video/mp4', 'videos'),
      uploadToR2(thumbBuffer, `${tempId}-thumb.jpg`, 'image/jpeg', 'videos'),
    ])

    return NextResponse.json({ success: true, videoUrl, thumbnailUrl, duration: Math.round(duration) })
  } catch (err) {
    console.error('[Video Upload Error]', err)
    return NextResponse.json({ error: '影片處理失敗，請稍後再試' }, { status: 500 })
  } finally {
    await Promise.all([inputPath, outputPath, thumbPath].map(p => unlink(p).catch(() => {})))
    if (tempKey) await deleteR2Key(tempKey).catch(() => {})
  }
}
