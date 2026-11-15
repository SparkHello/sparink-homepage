import { decodePlaylistCache, encodePlaylistCache, normalizePlaylist, PLAYLIST_CACHE_KEY } from "./model";
import type { MusicTrack } from "./model";

/** localStorage is optional: privacy settings and quota errors must not disable music. */
export async function loadPlaylist(ids: readonly string[], signal: AbortSignal, refresh: boolean): Promise<MusicTrack[]> {
  if (!refresh) {
    try {
      const cached = decodePlaylistCache(localStorage.getItem(PLAYLIST_CACHE_KEY), ids);
      if (cached) return cached;
    } catch { /* Fall through to the API when storage is unavailable. */ }
  }
  const response = await fetch(`/api/music?${new URLSearchParams({ ids: ids.join(",") })}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) throw new Error("歌单暂时无法连接，请稍后重试。");
  const payload: unknown = await response.json();
  const tracks = normalizePlaylist(payload, ids);
  if (!tracks.length) throw new Error("暂时没有可播放的歌曲，请稍后重试。");
  try {
    localStorage.setItem(PLAYLIST_CACHE_KEY, encodePlaylistCache(tracks, ids));
  } catch { /* Playback does not require a writable cache. */ }
  return tracks;
}

const lyricCache = new Map<string, string>();

export async function loadLyrics(id: string, signal: AbortSignal): Promise<string> {
  const cached = lyricCache.get(id);
  if (cached !== undefined) return cached;
  const response = await fetch(`/api/music?${new URLSearchParams({ lyricId: id })}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
  });
  if (!response.ok) throw new Error("Lyrics unavailable");
  const lyrics = await response.text();
  if (lyrics.length > 100_000) throw new Error("Lyrics too large");
  lyricCache.set(id, lyrics);
  return lyrics;
}
