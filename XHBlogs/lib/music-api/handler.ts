type FailureCode = "rate_limited" | "upstream_error";

type Song = {
  id: string;
  name: string;
  artist: string;
  author: string;
  cover: string;
  pic: string;
  url: string;
};

type SongResult = Song | { id: string; error: FailureCode | "not_found" };
type MusicQuery = { kind: "lyrics"; id: string } | { kind: "songs"; ids: string[] };
type MusicData = { kind: "lyrics"; body: string } | { kind: "songs"; body: SongResult[] };
type CacheItem = { data: MusicData; expires: number };

interface HandlerOptions {
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}

const SUCCESS_CACHE = "public, s-maxage=1800, stale-while-revalidate=86400";
const CACHE_DURATION = 30 * 60 * 1000;
const CACHE_CAPACITY = 128;
const SONG_ID = /^\d{1,20}$/;
const LIMITED_CODES = new Set([405, 406, 429, 460]);

class UpstreamFailure extends Error {
  readonly code: FailureCode;

  constructor(code: FailureCode) {
    super(code);
    this.name = "UpstreamFailure";
    this.code = code;
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function canonicalId(id: string): string {
  return id.replace(/^0+(?=\d)/, "");
}

function queryFrom(search: URLSearchParams): MusicQuery | string {
  const lyricId = search.get("lyricId")?.trim();
  if (lyricId) {
    return SONG_ID.test(lyricId)
      ? { kind: "lyrics", id: lyricId }
      : "Invalid lyricId parameter";
  }

  const rawIds = search.get("ids");
  if (!rawIds) return "Missing ids parameter";

  const ids = new Set<string>();
  for (const part of rawIds.split(",")) {
    const id = part.trim();
    if (!id) continue;
    if (!SONG_ID.test(id)) return "Invalid ids parameter";
    ids.add(id);
    if (ids.size > 30) return "Invalid ids parameter";
  }
  return ids.size ? { kind: "songs", ids: [...ids] } : "Invalid ids parameter";
}

function upstreamId(value: unknown): string | undefined {
  if (typeof value === "string" && SONG_ID.test(value)) return canonicalId(value);
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
}

function readSongs(payload: Record<string, unknown>, ids: string[]): SongResult[] {
  if (!Array.isArray(payload.songs)) throw new UpstreamFailure("upstream_error");

  const indexed = new Map<string, Record<string, unknown>>();
  for (const item of payload.songs) {
    const song = record(item);
    const id = upstreamId(song?.id);
    if (song && id !== undefined) indexed.set(id, song);
  }

  return ids.map((id): SongResult => {
    const song = indexed.get(canonicalId(id));
    if (!song) return { id, error: "not_found" };
    if (typeof song.name !== "string" || !song.name.trim()) {
      throw new UpstreamFailure("upstream_error");
    }

    const firstArtist = Array.isArray(song.artists) ? record(song.artists[0]) : undefined;
    const artist = typeof firstArtist?.name === "string" && firstArtist.name.trim()
      ? firstArtist.name
      : "未知歌手";
    const album = record(song.album);
    const cover = typeof album?.picUrl === "string" ? album.picUrl : "";

    return {
      id,
      name: song.name,
      artist,
      author: artist,
      cover,
      pic: cover,
      url: `https://music.163.com/song/media/outer/url?id=${canonicalId(id)}.mp3`,
    };
  });
}

function readLyrics(payload: Record<string, unknown>): string {
  if (payload.lrc === undefined || payload.lrc === null) return "";
  const lrc = record(payload.lrc);
  if (!lrc || (lrc.lyric !== undefined && typeof lrc.lyric !== "string")) {
    throw new UpstreamFailure("upstream_error");
  }
  return typeof lrc.lyric === "string" ? lrc.lyric : "";
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Each handler owns a bounded cache; only successful upstream reads enter it. */
export function createMusicHandler(options: HandlerOptions = {}): (request: Request) => Promise<Response> {
  const requestUpstream = options.fetch ?? globalThis.fetch;
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 6000;
  const cache = new Map<string, CacheItem>();
  const pending = new Map<string, Promise<MusicData>>();

  async function readUpstream(query: MusicQuery): Promise<MusicData> {
    const url = new URL(
      query.kind === "songs" ? "/api/song/detail/" : "/api/song/lyric",
      "https://music.163.com",
    );
    if (query.kind === "songs") {
      url.searchParams.set("ids", `[${query.ids.map(canonicalId).join(",")}]`);
    } else {
      url.searchParams.set("id", canonicalId(query.id));
      for (const key of ["lv", "kv", "tv"]) url.searchParams.set(key, "-1");
    }

    const response = await requestUpstream(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Referer: "https://music.163.com/",
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new UpstreamFailure(LIMITED_CODES.has(response.status) ? "rate_limited" : "upstream_error");
    }

    const raw: unknown = await response.json();
    const payload = record(raw);
    if (!payload) throw new UpstreamFailure("upstream_error");
    const code = typeof payload.code === "number" ? payload.code : Number(payload.code);
    if (LIMITED_CODES.has(code)) throw new UpstreamFailure("rate_limited");
    if (code !== 200) throw new UpstreamFailure("upstream_error");

    return query.kind === "songs"
      ? { kind: "songs", body: readSongs(payload, query.ids) }
      : { kind: "lyrics", body: readLyrics(payload) };
  }

  async function load(query: MusicQuery): Promise<MusicData> {
    const key = query.kind === "songs" ? `songs:${query.ids.join(",")}` : `lyrics:${query.id}`;
    const saved = cache.get(key);
    if (saved && saved.expires > now()) {
      // Refresh insertion order to evict the least recently used entry.
      cache.delete(key);
      cache.set(key, saved);
      return saved.data;
    }
    cache.delete(key);
    const current = pending.get(key);
    if (current) return current;

    const job = readUpstream(query).then((data) => {
      cache.set(key, { data, expires: now() + CACHE_DURATION });
      while (cache.size > CACHE_CAPACITY) {
        const oldest = cache.keys().next().value;
        if (oldest === undefined) break;
        cache.delete(oldest);
      }
      return data;
    }).finally(() => pending.delete(key));
    pending.set(key, job);
    return job;
  }

  return async (request) => {
    const query = queryFrom(new URL(request.url).searchParams);
    if (typeof query === "string") return errorResponse(query, 400);

    try {
      const data = await load(query);
      const headers = { "Cache-Control": SUCCESS_CACHE };
      return data.kind === "songs"
        ? Response.json(data.body, { headers })
        : new Response(data.body, { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
    } catch (error: unknown) {
      const code = error instanceof UpstreamFailure ? error.code : "upstream_error";
      if (query.kind === "lyrics") return errorResponse(code, code === "rate_limited" ? 429 : 502);
      return Response.json(query.ids.map((id) => ({ id, error: code })), {
        headers: { "Cache-Control": "no-store" },
      });
    }
  };
}
