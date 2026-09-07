// 为 albums.json 里已有的照片补上缩略图与原始尺寸。
// 新照片由 Sparink Studio 上传时自动生成，这个脚本只处理历史记录，可重复运行。
// 用法：node scripts/backfill-photo-thumbs.mjs [--dry-run]

import { readFile, writeFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = join(PROJECT_DIR, 'public')
const ALBUMS_FILE = join(PROJECT_DIR, 'data', 'albums.json')
const THUMB_WIDTH = 700
const THUMB_QUALITY = 80

const dryRun = process.argv.includes('--dry-run')
const fileFor = (url) => join(PUBLIC_DIR, url.replace(/^\//, ''))
const exists = (pathname) => stat(pathname).then(() => true, () => false)
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`

const albums = JSON.parse(await readFile(ALBUMS_FILE, 'utf8'))
let generated = 0
let reused = 0
let skipped = 0
let savedBytes = 0

for (const album of albums) {
  for (const photo of album.photos || []) {
    const source = fileFor(photo.url)
    if (!await exists(source)) {
      console.warn(`  ! 文件缺失，跳过：${photo.url}`)
      skipped += 1
      continue
    }

    const { width, height } = await sharp(source).metadata()
    photo.width = width
    photo.height = height

    // 本来就比缩略图还小的，直接用原图，不必多存一份。
    if (width <= THUMB_WIDTH) {
      delete photo.thumb
      skipped += 1
      continue
    }

    const thumbUrl = photo.url.replace(/\.webp$/, '-thumb.webp')
    const thumbFile = fileFor(thumbUrl)

    if (await exists(thumbFile)) {
      photo.thumb = thumbUrl
      reused += 1
      continue
    }

    if (dryRun) {
      console.log(`  + 将生成 ${thumbUrl}`)
      generated += 1
      continue
    }

    const info = await sharp(source)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY, effort: 4 })
      .toFile(thumbFile)

    const originalBytes = (await stat(source)).size
    savedBytes += originalBytes - info.size
    photo.thumb = thumbUrl
    generated += 1
    console.log(`  + ${thumbUrl}  ${kb(originalBytes)} → ${kb(info.size)}`)
  }
}

if (!dryRun) await writeFile(ALBUMS_FILE, `${JSON.stringify(albums, null, 2)}\n`)

console.log(`\n新生成 ${generated} 张，复用已有 ${reused} 张，跳过 ${skipped} 张`)
if (savedBytes > 0) console.log(`网格首屏体积减少约 ${(savedBytes / 1048576).toFixed(1)} MB`)
if (dryRun) console.log('（--dry-run，未写入任何文件）')
