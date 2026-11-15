"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "../siteConfig";
import { loadLyrics, loadPlaylist } from "../lib/music/client";
import { lyricAt, parseLyrics } from "../lib/music/model";
import type { LyricLine, MusicTrack, PlayMode } from "../lib/music/model";
import { MusicPlayer } from "../lib/music/player";

interface MusicContextType {
  playlist: MusicTrack[];
  currentIndex: number;
  currentSong: MusicTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackError: string;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  loadError: string;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (event: ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
  retryMusic: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);
const ids = siteConfig.cloudMusicIds.map(String);

export function MusicProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [player] = useState(() => new MusicPlayer(() => new Audio()));
  const playback = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot);
  const [request, setRequest] = useState(0);
  const [loading, setLoading] = useState({ isLoading: true, loadError: "" });
  const [lyric, setLyric] = useState<{ id: string; lines: LyricLine[]; failed: boolean }>({ id: "", lines: [], failed: false });
  const currentSong = playback.playlist[playback.currentIndex] ?? null;

  useEffect(() => {
    if (pathname === "/music") player.activate();
  }, [pathname, player]);

  useEffect(() => () => player.dispose(), [player]);

  useEffect(() => {
    if (!playback.hasRequested) return;
    const controller = new AbortController();
    void loadPlaylist(ids, controller.signal, request > 0).then((tracks) => {
      if (controller.signal.aborted) return;
      player.setPlaylist(tracks);
      setLoading({ isLoading: false, loadError: "" });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoading({ isLoading: false, loadError: error instanceof Error && error.name !== "TimeoutError"
        ? error.message : "连接音乐服务超时，请稍后重试。" });
    });
    return () => controller.abort();
  }, [playback.hasRequested, player, request]);

  useEffect(() => {
    if (!currentSong) return;
    const controller = new AbortController();
    const song = currentSong;
    const result = song.lyrics ? Promise.resolve(song.lyrics) : loadLyrics(song.id, controller.signal);
    void result.then((source) => {
      if (!controller.signal.aborted) setLyric({ id: song.id, lines: parseLyrics(source), failed: false });
    }).catch(() => {
      if (!controller.signal.aborted) setLyric({ id: song.id, lines: [], failed: true });
    });
    return () => controller.abort();
  }, [currentSong]);

  const currentLyric = !currentSong ? (loading.isLoading ? "正在载入歌单…" : "")
    : lyric.id !== currentSong.id ? "正在载入歌词…"
      : lyric.failed ? "歌词暂时不可用"
        : lyric.lines.length ? lyricAt(lyric.lines, playback.currentTime) || "音乐正在路上…" : "纯音乐或暂无歌词";
  const progress = playback.duration > 0
    ? Math.max(0, Math.min(100, playback.currentTime / playback.duration * 100)) : 0;

  return (
    <MusicContext.Provider value={{
      ...playback,
      ...loading,
      currentSong,
      progress,
      currentLyric,
      togglePlay: player.togglePlay,
      nextSong: player.nextSong,
      prevSong: player.prevSong,
      playSong: player.playSong,
      setVolume: player.setVolume,
      toggleMute: player.toggleMute,
      togglePlayMode: player.togglePlayMode,
      handleSeek: (event) => player.seek(Number(event.target.value)),
      retryMusic: () => {
        setLoading({ isLoading: true, loadError: "" });
        setRequest((value) => value + 1);
      },
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextType {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used inside MusicProvider");
  return context;
}
