import { spawn, execFile } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import sharp from 'sharp'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const execFileAsync = promisify(execFile)
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = resolve(SCRIPT_DIR, '..')
const REPO_DIR = resolve(PROJECT_DIR, '..')
const STATIC_DIR = join(SCRIPT_DIR, 'content-studio')
const HOST = '127.0.0.1'
const PORT = Number(process.env.CONTENT_STUDIO_PORT || 4317)
const SITE_PREVIEW_URL = 'http://127.0.0.1:3000'
const TOKEN = randomBytes(32).toString('hex')
const MAX_JSON_BYTES = 2 * 1024 * 1024
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024

const CONTENT_DIRECTORIES = {
  posts: join(PROJECT_DIR, 'posts'),
  chatters: join(PROJECT_DIR, 'chatters'),
  moments: join(PROJECT_DIR, 'moments'),
}
const ALBUMS_FILE = join(PROJECT_DIR, 'data', 'albums.json')
const MUSIC_FILE = join(PROJECT_DIR, 'data', 'music.json')
const SETTINGS_FILE = join(PROJECT_DIR, 'data', 'content-settings.json')
const UPLOADS_DIR = join(PROJECT_DIR, 'public', 'uploads')
const TRASH_DIR = join(PROJECT_DIR, '.content-studio', 'trash')

const PUBLISH_PATHS = [
  'XHBlogs/posts',
  'XHBlogs/chatters',
  'XHBlogs/moments',
  'XHBlogs/data/albums.json',
  'XHBlogs/data/music.json',
  'XHBlogs/data/content-settings.json',
  'XHBlogs/public/uploads',
]

const jobs = new Map()
let previewProcess = null
let publishRunning = false

function responseHeaders(contentType = 'application/json; charset=utf-8') {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob: http://127.0.0.1:3000; style-src 'self'; script-src 'self'; connect-src 'self' http://127.0.0.1:3000; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, responseHeaders())
  response.end(JSON.stringify(value))
}

function sendText(response, status, value, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(status, responseHeaders(contentType))
  response.end(value)
}

function isLocalHostHeader(request) {
  const host = String(request.headers.host || '').toLowerCase()
  return host === `${HOST}:${PORT}` || host === `localhost:${PORT}`
}

function isAuthorizedMutation(request) {
  return request.headers['x-studio-token'] === TOKEN
}

async function readBody(request, maximumBytes) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maximumBytes) throw Object.assign(new Error('请求内容过大'), { statusCode: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function readJson(request) {
  const buffer = await readBody(request, MAX_JSON_BYTES)
  try {
    return JSON.parse(buffer.toString('utf8') || '{}')
  } catch {
    throw Object.assign(new Error('JSON 格式无效'), { statusCode: 400 })
  }
}

function cleanSlug(value) {
  const slug = String(value || '')
    .normalize('NFKC')
    .trim()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  if (!slug || slug.length > 100 || !/^[\p{L}\p{N}_-]+$/u.test(slug)) {
    throw Object.assign(new Error('标识只能包含中文、字母、数字、连字符或下划线'), { statusCode: 400 })
  }
  return slug
}

function text(value, maximum = 10000) {
  const result = String(value ?? '').replaceAll('\u0000', '').trim()
  if (result.length > maximum) throw Object.assign(new Error(`文本不能超过 ${maximum} 个字符`), { statusCode: 400 })
  return result
}

function stringList(value, maximumItems = 30) {
  const list = Array.isArray(value) ? value : String(value || '').split(',')
  return list.map((item) => text(item, 100)).filter(Boolean).slice(0, maximumItems)
}

function safeUrl(value) {
  const url = text(value, 2048)
  if (!url) return ''
  if (url.startsWith('/uploads/')) return url
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
  } catch {}
  throw Object.assign(new Error('图片地址必须是本站上传路径或 HTTP(S) 地址'), { statusCode: 400 })
}

function parseFrontmatter(source) {
  const normalized = source.replace(/^\uFEFF/, '')
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: normalized }
  const parsed = parseYaml(match[1])
  return {
    data: parsed && typeof parsed === 'object' ? parsed : {},
    content: match[2].replace(/^\r?\n/, '').trimEnd(),
  }
}

function serializeFrontmatter(data, content) {
  const yaml = stringifyYaml(data, { lineWidth: 0 }).trimEnd()
  return `---\n${yaml}\n---\n\n${String(content || '').trim()}\n`
}

async function pathExists(pathname) {
  try {
    await access(pathname)
    return true
  } catch {
    return false
  }
}

async function readJsonFile(pathname, fallback) {
  try {
    return JSON.parse(await readFile(pathname, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJsonAtomic(pathname, value) {
  await mkdir(dirname(pathname), { recursive: true })
  const temporary = `${pathname}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, pathname)
}

async function listContent(kind) {
  const directory = CONTENT_DIRECTORIES[kind]
  await mkdir(directory, { recursive: true })
  const filenames = (await readdir(directory)).filter((name) => name.endsWith('.md'))
  const records = await Promise.all(filenames.map(async (filename) => {
    const slug = filename.slice(0, -3)
    const { data, content } = parseFrontmatter(await readFile(join(directory, filename), 'utf8'))
    return { slug, ...data, content }
  }))
  return records.sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')))
}

function contentPayload(kind, payload) {
  const date = text(payload.date, 40) || new Date().toISOString().slice(0, 10)
  const content = text(payload.content, 200000)
  if (kind === 'moments') {
    return {
      data: {
        date,
        location: text(payload.location, 200),
        images: stringList(payload.images, 20).map(safeUrl),
      },
      content,
    }
  }
  const title = text(payload.title, 200)
  if (!title) throw Object.assign(new Error('标题不能为空'), { statusCode: 400 })
  const data = {
    title,
    date,
    description: text(payload.description, 500),
    tags: stringList(payload.tags, 20),
    cover: safeUrl(payload.cover),
  }
  if (kind === 'chatters') data.mood = text(payload.mood, 80)
  return { data, content }
}

async function saveContent(kind, requestedSlug, payload) {
  const directory = CONTENT_DIRECTORIES[kind]
  if (!directory) throw Object.assign(new Error('未知内容类型'), { statusCode: 404 })
  const slug = cleanSlug(requestedSlug)
  const originalSlug = payload.originalSlug ? cleanSlug(payload.originalSlug) : slug
  const destination = join(directory, `${slug}.md`)
  const original = join(directory, `${originalSlug}.md`)
  await mkdir(directory, { recursive: true })
  if (slug !== originalSlug && await pathExists(destination)) {
    throw Object.assign(new Error('新的标识已经存在'), { statusCode: 409 })
  }
  const normalized = contentPayload(kind, payload)
  await writeFile(destination, serializeFrontmatter(normalized.data, normalized.content), 'utf8')
  if (slug !== originalSlug && await pathExists(original)) {
    await mkdir(TRASH_DIR, { recursive: true })
    await rename(original, join(TRASH_DIR, `${Date.now()}-${kind}-${originalSlug}.md`))
  }
  return { slug }
}

async function trashContent(kind, requestedSlug) {
  const directory = CONTENT_DIRECTORIES[kind]
  if (!directory) throw Object.assign(new Error('未知内容类型'), { statusCode: 404 })
  const slug = cleanSlug(requestedSlug)
  const source = join(directory, `${slug}.md`)
  if (!await pathExists(source)) throw Object.assign(new Error('内容不存在'), { statusCode: 404 })
  await mkdir(TRASH_DIR, { recursive: true })
  await rename(source, join(TRASH_DIR, `${Date.now()}-${kind}-${slug}.md`))
}

function validateAlbums(value) {
  if (!Array.isArray(value) || value.length > 100) throw Object.assign(new Error('相册数据无效'), { statusCode: 400 })
  const ids = new Set()
  return value.map((album) => {
    const id = cleanSlug(album.id)
    if (ids.has(id)) throw Object.assign(new Error(`相册标识重复：${id}`), { statusCode: 400 })
    ids.add(id)
    const photos = Array.isArray(album.photos) ? album.photos.slice(0, 500).map((photo) => ({
      url: safeUrl(photo.url),
      caption: text(photo.caption, 300),
    })).filter((photo) => photo.url) : []
    const cover = safeUrl(album.cover) || photos[0]?.url || ''
    return {
      id,
      title: text(album.title, 120) || id,
      description: text(album.description, 500),
      cover,
      date: text(album.date, 40) || new Date().toISOString().slice(0, 10),
      photos,
    }
  })
}

function musicId(value) {
  const source = String(value || '').trim()
  const direct = source.match(/^\d{1,20}$/)?.[0]
  const fromUrl = source.match(/[?&]id=(\d{1,20})/)?.[1]
  const id = direct || fromUrl || ''
  if (!id) throw Object.assign(new Error('请输入网易云歌曲 ID 或包含 id= 的歌曲链接'), { statusCode: 400 })
  return id
}

function validateMusic(value) {
  if (!Array.isArray(value) || value.length > 100) throw Object.assign(new Error('歌单数据无效'), { statusCode: 400 })
  const seen = new Set()
  const result = []
  for (const song of value) {
    const normalized = { id: musicId(song.id), label: text(song.label, 120) }
    if (!seen.has(normalized.id)) {
      seen.add(normalized.id)
      result.push(normalized)
    }
  }
  return result
}

function validateSettings(value) {
  return {
    moments: Boolean(value.moments),
    chatter: Boolean(value.chatter),
    photoWall: Boolean(value.photoWall),
    music: Boolean(value.music),
  }
}

async function uploadImage(request, requestUrl) {
  const originalName = decodeURIComponent(String(request.headers['x-file-name'] || 'image'))
  const buffer = await readBody(request, MAX_UPLOAD_BYTES)
  if (!buffer.length) throw Object.assign(new Error('图片为空'), { statusCode: 400 })
  const now = new Date()
  const scope = requestUrl.searchParams.get('scope') === 'photos' ? 'photos' : 'content'
  const folder = join(
    UPLOADS_DIR,
    scope,
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
  )
  await mkdir(folder, { recursive: true })
  const stem = originalName
    .replace(extname(originalName), '')
    .normalize('NFKC')
    .replaceAll(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'image'
  const filename = `${stem}-${randomUUID().slice(0, 8)}.webp`
  const output = join(folder, filename)
  let info
  try {
    info = await sharp(buffer, { failOn: 'error', limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toFile(output)
  } catch {
    throw Object.assign(new Error('无法读取这张图片，请换用 JPG、PNG、WebP 或系统可识别的 HEIC'), { statusCode: 400 })
  }
  const relative = output.slice(join(PROJECT_DIR, 'public').length).split('\\').join('/')
  return { url: relative, width: info.width, height: info.height, bytes: info.size }
}

async function gitStatus() {
  const { stdout } = await execFileAsync('git', ['-c', 'core.quotepath=false', 'status', '--porcelain=v1'], {
    cwd: REPO_DIR,
    maxBuffer: 2 * 1024 * 1024,
  })
  const { stdout: branch } = await execFileAsync('git', ['branch', '--show-current'], { cwd: REPO_DIR })
  const changes = stdout.split(/\r?\n/).filter(Boolean).map((line) => ({
    status: line.slice(0, 2),
    path: line.slice(3),
  }))
  return { branch: branch.trim(), changes }
}

function isPublishPath(pathname) {
  const paths = pathname.includes(' -> ') ? pathname.split(' -> ') : [pathname]
  return paths.every((item) => PUBLISH_PATHS.some((allowed) => item === allowed || item.startsWith(`${allowed}/`)))
}

function appendJob(job, message) {
  const line = String(message).replaceAll(/\x1b\[[0-9;]*m/g, '')
  job.logs = `${job.logs}${line}`.slice(-100000)
}

function runCommand(job, command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    appendJob(job, `\n$ ${command} ${args.join(' ')}\n`)
    const child = spawn(command, args, {
      cwd: options.cwd || PROJECT_DIR,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout.on('data', (chunk) => appendJob(job, chunk))
    child.stderr.on('data', (chunk) => appendJob(job, chunk))
    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else rejectPromise(new Error(`${command} 退出，状态码 ${code}`))
    })
  })
}

async function runPublishJob(job, message) {
  publishRunning = true
  try {
    job.status = 'running'
    const before = await gitStatus()
    const outside = before.changes.filter((change) => !isPublishPath(change.path))
    if (outside.length) {
      throw new Error(`存在控制台范围外的未提交改动：${outside.map((item) => item.path).join('、')}`)
    }
    if (!before.changes.length) throw new Error('没有需要发布的内容改动')

    await runCommand(job, 'npm', ['run', 'build'], {
      cwd: PROJECT_DIR,
      env: { NEXT_DIST_DIR: '.next-studio-build' },
    })
    await runCommand(job, 'git', ['add', '--', ...PUBLISH_PATHS], { cwd: REPO_DIR })
    const { stdout: staged } = await execFileAsync('git', ['diff', '--cached', '--name-only'], { cwd: REPO_DIR })
    if (!staged.trim()) throw new Error('构建通过，但没有可提交的内容')
    await runCommand(job, 'git', ['commit', '-m', message], { cwd: REPO_DIR })
    await runCommand(job, 'git', ['push', 'origin', 'HEAD:main'], { cwd: REPO_DIR })
    job.status = 'success'
    appendJob(job, '\n✓ 已推送到 GitHub，Cloudflare 将自动部署。\n')
  } catch (error) {
    job.status = 'failed'
    appendJob(job, `\n✗ ${error instanceof Error ? error.message : String(error)}\n`)
  } finally {
    job.finishedAt = Date.now()
    publishRunning = false
  }
}

async function previewIsReady() {
  try {
    const response = await fetch(SITE_PREVIEW_URL, { signal: AbortSignal.timeout(800) })
    return response.ok
  } catch {
    return false
  }
}

async function ensurePreview() {
  if (await previewIsReady()) return true
  if (previewProcess && previewProcess.exitCode === null) return false
  previewProcess = spawn('npm', ['run', 'dev'], {
    cwd: PROJECT_DIR,
    env: { ...process.env, NEXT_DIST_DIR: '.next-studio-dev' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  previewProcess.stdout.on('data', (chunk) => process.stdout.write(`[site] ${chunk}`))
  previewProcess.stderr.on('data', (chunk) => process.stderr.write(`[site] ${chunk}`))
  previewProcess.on('exit', () => { previewProcess = null })
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
    if (await previewIsReady()) return true
  }
  return false
}

async function statePayload() {
  const [posts, chatters, moments, albums, music, settings, git] = await Promise.all([
    listContent('posts'),
    listContent('chatters'),
    listContent('moments'),
    readJsonFile(ALBUMS_FILE, []),
    readJsonFile(MUSIC_FILE, []),
    readJsonFile(SETTINGS_FILE, {}),
    gitStatus(),
  ])
  return { posts, chatters, moments, albums, music, settings: validateSettings(settings), git }
}

async function serveStatic(requestUrl, response) {
  const files = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/studio.css': ['studio.css', 'text/css; charset=utf-8'],
    '/studio.js': ['studio.js', 'text/javascript; charset=utf-8'],
  }
  const target = files[requestUrl.pathname]
  if (!target) return false
  sendText(response, 200, await readFile(join(STATIC_DIR, target[0]), 'utf8'), target[1])
  return true
}

const server = createServer(async (request, response) => {
  if (!isLocalHostHeader(request)) {
    sendJson(response, 403, { error: '仅允许本机访问' })
    return
  }

  const requestUrl = new URL(request.url || '/', `http://${HOST}:${PORT}`)
  try {
    if (request.method === 'GET' && await serveStatic(requestUrl, response)) return

    if (request.method === 'GET' && requestUrl.pathname === '/api/session') {
      sendJson(response, 200, { token: TOKEN, previewUrl: SITE_PREVIEW_URL })
      return
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/state') {
      sendJson(response, 200, await statePayload())
      return
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/preview') {
      sendJson(response, 200, { ready: await previewIsReady(), url: SITE_PREVIEW_URL })
      return
    }
    if (request.method === 'GET' && requestUrl.pathname.startsWith('/api/jobs/')) {
      const job = jobs.get(requestUrl.pathname.split('/').pop())
      if (!job) throw Object.assign(new Error('任务不存在'), { statusCode: 404 })
      sendJson(response, 200, job)
      return
    }

    if (!isAuthorizedMutation(request)) {
      sendJson(response, 401, { error: '本地会话已失效，请刷新控制台' })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/preview') {
      sendJson(response, 200, { ready: await ensurePreview(), url: SITE_PREVIEW_URL })
      return
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/upload') {
      sendJson(response, 201, await uploadImage(request, requestUrl))
      return
    }

    const contentMatch = requestUrl.pathname.match(/^\/api\/content\/(posts|chatters|moments)\/([^/]+)$/)
    if (contentMatch && request.method === 'PUT') {
      sendJson(response, 200, await saveContent(contentMatch[1], decodeURIComponent(contentMatch[2]), await readJson(request)))
      return
    }
    if (contentMatch && request.method === 'DELETE') {
      await trashContent(contentMatch[1], decodeURIComponent(contentMatch[2]))
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'PUT' && requestUrl.pathname === '/api/albums') {
      const albums = validateAlbums(await readJson(request))
      await writeJsonAtomic(ALBUMS_FILE, albums)
      sendJson(response, 200, { albums })
      return
    }
    if (request.method === 'PUT' && requestUrl.pathname === '/api/music') {
      const music = validateMusic(await readJson(request))
      await writeJsonAtomic(MUSIC_FILE, music)
      sendJson(response, 200, { music })
      return
    }
    if (request.method === 'PUT' && requestUrl.pathname === '/api/settings') {
      const settings = validateSettings(await readJson(request))
      await writeJsonAtomic(SETTINGS_FILE, settings)
      sendJson(response, 200, { settings })
      return
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/publish') {
      if (publishRunning) throw Object.assign(new Error('已有发布任务正在运行'), { statusCode: 409 })
      const body = await readJson(request)
      const message = text(body.message, 100).replaceAll(/[\r\n]+/g, ' ') || 'content: update from Sparink Studio'
      const job = {
        id: randomUUID(),
        status: 'queued',
        logs: '',
        startedAt: Date.now(),
        finishedAt: null,
      }
      jobs.set(job.id, job)
      void runPublishJob(job, message)
      sendJson(response, 202, { id: job.id })
      return
    }

    sendJson(response, 404, { error: '接口不存在' })
  } catch (error) {
    const status = Number(error?.statusCode) || 500
    if (status >= 500) console.error('[studio]', error)
    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) })
  }
})

server.listen(PORT, HOST, async () => {
  console.log(`Sparink Studio: http://${HOST}:${PORT}`)
  console.log(`Site preview: ${SITE_PREVIEW_URL}`)
  void ensurePreview()
  if (process.argv.includes('--open')) {
    try { await execFileAsync('open', [`http://${HOST}:${PORT}`]) } catch {}
  }
})

function shutdown() {
  if (previewProcess && previewProcess.exitCode === null) previewProcess.kill('SIGTERM')
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
