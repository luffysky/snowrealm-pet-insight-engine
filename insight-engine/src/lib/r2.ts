import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

/** 產生瀏覽器直傳 R2 的簽名網址（Vercel 請求上限 4.5 MB，大檔不能經過 API）。 */
export async function createPresignedUpload(
  originalFilename: string,
  contentType: string,
  size: number,
  folder: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const ext = originalFilename.includes('.') ? originalFilename.split('.').pop() : 'bin'
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${ext}`
  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn: 900, signableHeaders: new Set(['content-type']) },
  )
  return { uploadUrl, publicUrl: `${PUBLIC_URL}/${key}`, key }
}

/** 從 R2 讀出檔案（影片轉檔用）。 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const res = await r2Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
  return Buffer.from(await res.Body!.transformToByteArray())
}

/** 用 key 刪除 R2 檔案。 */
export async function deleteR2Key(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
}
