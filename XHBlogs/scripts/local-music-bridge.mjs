import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const HOST = '127.0.0.1'
const PORT = 3210
const QQ_MUSIC_BUNDLE_ID = 'com.tencent.QQMusicMac'
const qqMusicDatabase = join(
  homedir(),
  'Library/Containers/com.tencent.QQMusicMac/Data/Library/Application Support/QQMusicMac/qqmusic.sqlite',
)

let trackCache = null
let playbackClock = null

function advancePlaybackClock(now) {
  if (!playbackClock) return
  const elapsed = Math.max(0, (now - playbackClock.updatedAt) / 1000)
  if (playbackClock.wasPlaying) playbackClock.position += elapsed
  playbackClock.updatedAt = now
}

function sqlText(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`
}

function artworkMimeType(base64) {
  if (!base64) return null
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBOR')) return 'image/png'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  return 'application/octet-stream'
}

async function readSystemNowPlaying() {
  const { stdout } = await execFileAsync('nowplaying-cli', ['get-raw'], {
    timeout: 2500,
    maxBuffer: 2 * 1024 * 1024,
  })
  const raw = JSON.parse(stdout)
  if (!raw || raw.kMRMediaRemoteNowPlayingInfoClientBundleIdentifier !== QQ_MUSIC_BUNDLE_ID) {
    return null
  }

  const artwork = raw.kMRMediaRemoteNowPlayingInfoArtworkData || ''
  const mime = raw.kMRMediaRemoteNowPlayingInfoArtworkMIMEType || artworkMimeType(artwork)

  return {
    title: raw.kMRMediaRemoteNowPlayingInfoTitle || '',
    artist: raw.kMRMediaRemoteNowPlayingInfoArtist || '',
    album: raw.kMRMediaRemoteNowPlayingInfoAlbum || '',
    duration: Number(raw.kMRMediaRemoteNowPlayingInfoDuration) || 0,
    reportedPosition: Number(raw.kMRMediaRemoteNowPlayingInfoElapsedTime) || 0,
    playbackRate: Number(raw.kMRMediaRemoteNowPlayingInfoPlaybackRate) || 0,
    cover: artwork && mime ? `data:${mime};base64,${artwork}` : '',
  }
}

async function lookupTrack(title, artist) {
  const cacheKey = `${title}\u0000${artist}`
  if (trackCache?.key === cacheKey) return trackCache.value

  const sql = `
    SELECT
      id,
      K_SONG_RESERVE1 AS songMid,
      K_SONG_RESERVE12 AS durationMs
    FROM SONGS
    WHERE name = ${sqlText(title)}
      AND singer = ${sqlText(artist)}
    ORDER BY type DESC
    LIMIT 1;
  `

  let song = null
  try {
    const { stdout } = await execFileAsync('sqlite3', ['-json', qqMusicDatabase, sql], {
      timeout: 1500,
    })
    song = JSON.parse(stdout || '[]')[0] || null
  } catch {
    song = null
  }

  let lrc = ''
  if (song?.songMid) {
    try {
      const lyricUrl = new URL('https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg')
      lyricUrl.searchParams.set('songmid', song.songMid)
      lyricUrl.searchParams.set('format', 'json')
      lyricUrl.searchParams.set('nobase64', '1')
      const response = await fetch(lyricUrl, {
        headers: {
          Referer: 'https://y.qq.com/',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: AbortSignal.timeout(3500),
      })
      if (response.ok) {
        const data = await response.json()
        lrc = typeof data.lyric === 'string' ? data.lyric : ''
      }
    } catch {
      lrc = ''
    }
  }

  const value = {
    id: song?.id ? String(song.id) : cacheKey,
    songMid: song?.songMid || '',
    duration: song?.durationMs ? Number(song.durationMs) / 1000 : 0,
    lrc,
  }
  trackCache = { key: cacheKey, value }
  return value
}

function updatePlaybackClock(track, now) {
  const key = `${track.title}\u0000${track.artist}`
  const systemSaysPlaying = track.playbackRate > 0
  const reportedPosition = track.reportedPosition
  const hasUsefulPosition = reportedPosition > 1.5

  if (!playbackClock || playbackClock.key !== key) {
    playbackClock = {
      key,
      position: hasUsefulPosition ? reportedPosition : 0,
      updatedAt: now,
      wasPlaying: systemSaysPlaying,
      reliable: hasUsefulPosition,
      forcedPlaying: null,
      forcedAt: 0,
      lastReportedPosition: reportedPosition,
    }
  } else {
    advancePlaybackClock(now)

    const reportAdvanced = reportedPosition > playbackClock.lastReportedPosition + 0.4
    if (
      playbackClock.forcedPlaying === false &&
      reportAdvanced &&
      now - playbackClock.forcedAt > 2500
    ) {
      // The song was resumed directly inside QQ Music instead of through the website.
      playbackClock.forcedPlaying = null
    }

    if (hasUsefulPosition) {
      // QQ Music reports whole seconds and can briefly return the previous value.
      // Accept forward corrections and real seeks, but never let a one-second stale
      // sample pull the smooth local clock backwards.
      const reportJumpedBack = reportedPosition < playbackClock.lastReportedPosition - 3
      if (
        reportedPosition > playbackClock.position + 1.25 ||
        reportJumpedBack
      ) {
        playbackClock.position = reportedPosition
      }
      playbackClock.reliable = true
    }

    playbackClock.lastReportedPosition = reportedPosition
  }

  const isPlaying = playbackClock.forcedPlaying ?? systemSaysPlaying
  playbackClock.wasPlaying = isPlaying

  if (track.duration > 0) {
    playbackClock.position = Math.min(playbackClock.position, track.duration)
  }

  return {
    currentTime: playbackClock.position,
    isPlaying,
    positionMode: playbackClock.reliable ? 'reported' : 'estimated',
  }
}

async function getNowPlaying() {
  const systemTrack = await readSystemNowPlaying()
  if (!systemTrack?.title) return { available: false }

  const localTrack = await lookupTrack(systemTrack.title, systemTrack.artist)
  const duration = systemTrack.duration || localTrack.duration
  const playback = updatePlaybackClock({ ...systemTrack, duration }, Date.now())

  return {
    available: true,
    source: 'qqmusic',
    id: `qqmusic:${localTrack.id}`,
    title: systemTrack.title,
    artist: systemTrack.artist,
    album: systemTrack.album,
    cover: systemTrack.cover,
    duration,
    lrc: localTrack.lrc,
    ...playback,
  }
}

async function runControl(action, value) {
  const commands = {
    toggle: ['togglePlayPause'],
    next: ['next'],
    previous: ['previous'],
    seek: ['seek', String(Math.max(0, Number(value) || 0))],
  }
  const args = commands[action]
  if (!args) throw new Error('Unsupported control')

  await execFileAsync('nowplaying-cli', args, { timeout: 2500 })
  const now = Date.now()
  if (action === 'toggle' && playbackClock) {
    advancePlaybackClock(now)
    const nextPlaying = !playbackClock.wasPlaying
    playbackClock.forcedPlaying = nextPlaying
    playbackClock.forcedAt = now
    playbackClock.wasPlaying = nextPlaying
  } else if (action === 'seek' && playbackClock) {
    playbackClock.position = Math.max(0, Number(value) || 0)
    playbackClock.updatedAt = now
    playbackClock.lastReportedPosition = playbackClock.position
    playbackClock.reliable = true
  } else if (action === 'next' || action === 'previous') {
    playbackClock = null
  }
}

function corsHeaders(request) {
  const origin = request.headers.origin || ''
  const allowed = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  return {
    'Access-Control-Allow-Origin': allowed ? origin : `http://${HOST}:3000`,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function sendJson(response, status, body, headers) {
  response.writeHead(status, { ...headers, 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

const server = createServer(async (request, response) => {
  const headers = corsHeaders(request)
  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers)
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && request.url === '/now-playing') {
      sendJson(response, 200, await getNowPlaying(), headers)
      return
    }

    if (request.method === 'POST' && request.url === '/control') {
      let body = ''
      for await (const chunk of request) body += chunk
      const { action, value } = JSON.parse(body || '{}')
      await runControl(action, value)
      sendJson(response, 200, { ok: true }, headers)
      return
    }

    sendJson(response, 404, { error: 'Not found' }, headers)
  } catch (error) {
    sendJson(response, 503, { available: false, error: String(error) }, headers)
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Local QQ Music bridge: http://${HOST}:${PORT}/now-playing`)
})
