import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

/** 上傳檔案到 R2 */
export async function uploadToR2(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  folder: string = 'og',
): Promise<string> {
  const ext = originalFilename.split('.').pop()
  const hash = crypto.randomBytes(16).toString('hex')
  const filename = `${Date.now()}-${hash}.${ext}`
  const key = `${folder}/${filename}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }),
  )

  return `${PUBLIC_URL}/${key}`
}

/** 從 R2 刪除檔案 */
export async function deleteFromR2(url: string): Promise<void> {
  const key = url.replace(`${PUBLIC_URL}/`, '')
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  )
}
