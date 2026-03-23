/**
 * 讓 node 腳本與 Next 一致：先載入 .env，再以 .env.local 覆寫。
 * 使用方式：在其它 .mjs 第一行寫 import './load-dotenv.mjs'
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(root, '.env'), quiet: true })
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })
