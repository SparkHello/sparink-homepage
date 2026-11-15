export type PlayMode = "loop" | "single" | "random";

export interface MusicTrack {
  id: string;
  title: string;
  name: string;
  artist: string;
  author: string;
  cover: string;
  pic: string;
  url: string;
  lyrics: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

const CACHE_VERSION = 1;
export const PLAYLIST_CACHE_KEY = "sparink.music.playlist.v1";
export const PLAYLIST_CACHE_AGE = 6 * 60 * 60 * 1000;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mediaUrl(value: unknown): string {
  const candidate = text(value);
  if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\")) return candidate;
  try {
    const parsed = new URL(candidate);
    return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.href
      : "";
  } catch {
    return "";
  }
}

/** Accept data at the network/storage boundary; the rest of the player uses one shape. */
export function normalizePlaylist(value: unknown, requestedIds: readonly string[]): MusicTrack[] {
  if (!Array.isArray(value)) return [];
  const permitted = new Set(requestedIds);
  const found = new Map<string, MusicTrack>();
  for (const item of value) {
    if (!record(item)) continue;
    const id = typeof item.id === "number" && Number.isSafeInteger(item.id)
      ? String(item.id)
      : text(item.id);
    const url = mediaUrl(item.url);
    if (!permitted.has(id) || found.has(id) || !url) continue;
    const title = text(item.title) || text(item.name) || "未命名曲目";
    const artist = text(item.artist) || text(item.author) || "未知艺术家";
    const cover = mediaUrl(item.cover) || mediaUrl(item.pic);
    const lyrics = typeof item.lyrics === "string" && item.lyrics.length <= 100_000 ? item.lyrics : "";
    found.set(id, { id, title, name: title, artist, author: artist, cover, pic: cover, url, lyrics });
  }
  return [...new Set(requestedIds)].flatMap((id) => {
    const track = found.get(id);
    return track ? [track] : [];
  });
}

export function encodePlaylistCache(tracks: MusicTrack[], ids: readonly string[], now = Date.now()): string {
  return JSON.stringify({ version: CACHE_VERSION, ids, savedAt: now, tracks });
}

export function decodePlaylistCache(raw: string | null, ids: readonly string[], now = Date.now()): MusicTrack[] | null {
  if (!raw || raw.length > 1_000_000) return null;
  try {
    const entry: unknown = JSON.parse(raw);
    if (!record(entry) || entry.version !== CACHE_VERSION || !Array.isArray(entry.ids)
      || JSON.stringify(entry.ids) !== JSON.stringify(ids)
      || typeof entry.savedAt !== "number" || !Number.isFinite(entry.savedAt)
      || entry.savedAt > now || now - entry.savedAt >= PLAYLIST_CACHE_AGE
      || !Array.isArray(entry.tracks) || entry.tracks.length === 0) return null;
    const tracks = normalizePlaylist(entry.tracks, ids);
    // A damaged or injected row invalidates the whole entry, rather than silently changing the saved list.
    const savedTracks = entry.tracks;
    return tracks.length === savedTracks.length && tracks.every((track, index) => {
      const saved: unknown = savedTracks[index];
      return record(saved) && Object.entries(track).every(([key, value]) => saved[key] === value);
    }) ? tracks : null;
  } catch {
    return null;
  }
}

/** LRC may assign several timestamps to a line; fractional seconds need their actual precision. */
export function parseLyrics(source: string): LyricLine[] {
  if (source.length > 100_000) return [];
  const lines: LyricLine[] = [];
  for (const row of source.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    const content = row.replace(/\[\d+:\d{2}(?:\.\d{1,3})?\]/g, "").replace(/[\p{Cc}\p{Cf}]/gu, "").trim();
    if (!content) continue;
    for (const stamp of stamps) {
      const seconds = Number(stamp[2]);
      const time = Number(stamp[1]) * 60 + seconds + Number(`0.${stamp[3] ?? "0"}`);
      if (seconds < 60 && Number.isFinite(time)) lines.push({ time: Math.max(0, time), text: content });
    }
  }
  return lines.sort((left, right) => left.time - right.time);
}

export function lyricAt(lines: readonly LyricLine[], seconds: number): string {
  if (!Number.isFinite(seconds)) return "";
  let first = 0;
  let last = lines.length;
  while (first < last) {
    const middle = Math.floor((first + last) / 2);
    if (lines[middle].time <= seconds) first = middle + 1;
    else last = middle;
  }
  return first ? lines[first - 1].text : "";
}
