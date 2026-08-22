import { NextRequest, NextResponse } from 'next/server'

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

const CACHE_TTL_MS = 30 * 60 * 1000
const PUBLIC_CACHE_CONTROL = 'public, s-maxage=1800, stale-while-revalidate=86400'
const MAX_SONGS = 30

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  error?: string
}

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const detailsCache = new Map<string, CacheEntry<SongResult[]>>()
const lyricsCache = new Map<string, CacheEntry<string>>()

class MusicApiError extends Error {
  code: 'rate_limited' | 'upstream_error'

  constructor(code: 'rate_limited' | 'upstream_error', message: string) {
    super(message)
    this.code = code
  }
}

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

function isValidSongId(value: string) {
  return /^\d{1,20}$/.test(value)
}

function jsonWithCache(value: SongResult[]) {
  return NextResponse.json(value, {
    headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL },
  })
}

function textWithCache(value: string) {
  return new NextResponse(value, {
    headers: {
      'Cache-Control': PUBLIC_CACHE_CONTROL,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function detectUpstreamError(payload: any) {
  if (payload?.code === 405 || payload?.code === 406 || payload?.code === 460) {
    throw new MusicApiError('rate_limited', payload.message || payload.msg || '网易云请求受限')
  }
  if (!payload || (payload.code && payload.code !== 200)) {
    throw new MusicApiError('upstream_error', payload?.message || payload?.msg || '网易云接口异常')
  }
}

async function fetchNeteaseJson(url: string) {
  const response = await fetch(url, {
    headers: NET_EASE_HEADERS,
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })

  if (!response.ok) {
    throw new MusicApiError(
      response.status === 405 || response.status === 406 || response.status === 429
        ? 'rate_limited'
        : 'upstream_error',
      `网易云接口返回 ${response.status}`,
    )
  }

  const payload = await response.json()
  detectUpstreamError(payload)
  return payload
}

async function fetchDetailsFromNetease(songIds: string[]): Promise<SongResult[]> {
  // 歌曲详情接口支持批量 ID，一次取完整歌单，避免每首各发一次请求。
  const encodedIds = encodeURIComponent(`[${songIds.join(',')}]`)
  const detail = await fetchNeteaseJson(
    `https://music.163.com/api/song/detail/?ids=${encodedIds}`,
  )
  const songsById = new Map(
    (detail.songs || []).map((song: any) => [String(song.id), song]),
  )

  return songIds.map((songId) => {
    const song: any = songsById.get(songId)
    if (!song) return { id: songId, error: 'not_found' }

    const artistName = song.artists?.[0]?.name || '未知歌手'
    const cover = song.album?.picUrl || ''

    return {
      id: songId,
      name: song.name,
      artist: artistName,
      author: artistName,
      cover,
      pic: cover,
      url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
    }
  })
}

async function fetchLyricsFromNetease(songId: string) {
  const payload = await fetchNeteaseJson(
    `https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`,
  )
  return payload.lrc?.lyric || ''
}

async function fetchProductionDetails(songIds: string[]): Promise<SongResult[] | null> {
  if (process.env.NODE_ENV === 'production') return null

  try {
    const response = await fetch(
      `https://sparink.net/api/music?ids=${songIds.join(',')}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) },
    )
    if (!response.ok) return null
    const payload = await response.json()
    return Array.isArray(payload) ? payload : null
  } catch {
    return null
  }
}

async function fetchProductionLyrics(songId: string): Promise<string | null> {
  if (process.env.NODE_ENV === 'production') return null

  try {
    const lyricResponse = await fetch(
      `https://sparink.net/api/music?lyricId=${songId}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) },
    )
    if (lyricResponse.ok) return await lyricResponse.text()

    // 兼容尚未更新为按需歌词接口的线上版本。
    const legacyResponse = await fetch(
      `https://sparink.net/api/music?ids=${songId}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) },
    )
    if (!legacyResponse.ok) return null
    const payload = await legacyResponse.json()
    return Array.isArray(payload) ? payload[0]?.lrc || null : null
  } catch {
    return null
  }
}

async function getDetails(songIds: string[]) {
  const cacheKey = songIds.join(',')
  const cached = readCache(detailsCache, cacheKey)
  if (cached) return cached

  try {
    const results = await fetchDetailsFromNetease(songIds)
    writeCache(detailsCache, cacheKey, results)
    return results
  } catch (error) {
    const fallback = await fetchProductionDetails(songIds)
    if (fallback?.some((song) => song?.url && !song.error)) {
      writeCache(detailsCache, cacheKey, fallback)
      return fallback
    }

    const errorCode = error instanceof MusicApiError ? error.code : 'upstream_error'
    console.error('[api/music] 获取歌单失败:', error)
    return songIds.map((id) => ({ id, error: errorCode }))
  }
}

async function getLyrics(songId: string) {
  const cached = readCache(lyricsCache, songId)
  if (cached !== null) return cached

  try {
    const lyrics = await fetchLyricsFromNetease(songId)
    writeCache(lyricsCache, songId, lyrics)
    return lyrics
  } catch (error) {
    const fallback = await fetchProductionLyrics(songId)
    if (fallback !== null) {
      writeCache(lyricsCache, songId, fallback)
      return fallback
    }
    throw error
  }
}

export async function GET(request: NextRequest) {
  const lyricId = request.nextUrl.searchParams.get('lyricId')?.trim()
  if (lyricId) {
    if (!isValidSongId(lyricId)) {
      return NextResponse.json({ error: 'Invalid lyricId parameter' }, { status: 400 })
    }

    try {
      return textWithCache(await getLyrics(lyricId))
    } catch (error) {
      const isRateLimited = error instanceof MusicApiError && error.code === 'rate_limited'
      return NextResponse.json(
        { error: isRateLimited ? 'rate_limited' : 'upstream_error' },
        { status: isRateLimited ? 429 : 502 },
      )
    }
  }

  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  const songIds = [...new Set(ids.split(',').map((id) => id.trim()).filter(Boolean))]
  if (
    songIds.length === 0 ||
    songIds.length > MAX_SONGS ||
    songIds.some((id) => !isValidSongId(id))
  ) {
    return NextResponse.json({ error: 'Invalid ids parameter' }, { status: 400 })
  }

  return jsonWithCache(await getDetails(songIds))
}
