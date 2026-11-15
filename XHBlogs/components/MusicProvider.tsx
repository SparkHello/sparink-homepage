"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { siteConfig } from "../siteConfig";
import { usePathname } from "next/navigation";

// 【增强版 LRC 歌词解析】
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];

  for (let line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      let text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, "").trim();

      // 剔除控制字符
      const cleanText = text.replace(
        /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g,
        "",
      );

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

// 🌟 1. 扩充 Context 类型，加入 MusicPage 需要的所有属性
type PlayMode = "loop" | "single" | "random";

interface MusicContextType {
  playlist: any[];
  currentIndex: number;
  currentSong: any; // 扩展了 lyrics 属性
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
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
  retryMusic: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);
const MUSIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function MusicProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [musicRequested, setMusicRequested] = useState(false);
  useEffect(() => {
    if (pathname === "/music") setMusicRequested(true);
  }, [pathname]);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在载入歌单…");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");

  const audioRef = useRef<HTMLAudioElement>(null);
  // Playback intent is separate from the audio element's actual playing state.
  const wantsToPlay = useRef(false);
  const playAttempt = useRef(0);

  function requestPlay(audio: HTMLAudioElement) {
    const attempt = ++playAttempt.current;
    wantsToPlay.current = true;
    setPlaybackError("");
    setIsBuffering(true);
    if (audio.error) audio.load();
    audio.play().then(() => {
      if (attempt !== playAttempt.current || !wantsToPlay.current || audio.paused || audio.readyState < 3) return;
      setIsPlaying(true);
      setIsBuffering(false);
      setPlaybackError("");
    }).catch((error: unknown) => {
      if (attempt !== playAttempt.current) return;
      wantsToPlay.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      setPlaybackError(error instanceof DOMException && error.name === "NotAllowedError"
        ? "浏览器暂停了播放，请再点一下播放。"
        : "这首歌暂时无法播放，可以重试或换一首。");
    });
  }

  function pausePlayback() {
    wantsToPlay.current = false;
    playAttempt.current += 1;
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsBuffering(false);
  }

  useEffect(() => {
    if (!musicRequested) return;
    let isMounted = true;
    const fetchMusicData = async () => {
      const songIds = siteConfig.cloudMusicIds || [];
      const cacheKey = `sparink-music-v2:${songIds.join(",")}`;
      setIsLoading(true);
      setLoadError("");

      try {
        let rawResults: any[] | null = null;

        if (retryKey === 0) {
          try {
            const cached = window.localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (
                Array.isArray(parsed?.songs) &&
                Date.now() - Number(parsed.cachedAt) < MUSIC_CACHE_TTL_MS
              ) {
                rawResults = parsed.songs;
              }
            }
          } catch {
            window.localStorage.removeItem(cacheKey);
          }
        }

        if (!rawResults) {
          const res = await fetch(`/api/music?ids=${songIds.join(",")}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(12000),
          });
          if (!res.ok) throw new Error(`音乐接口返回 ${res.status}`);
          rawResults = await res.json();
          if (!Array.isArray(rawResults))
            throw new Error("音乐接口数据格式异常");

          if (rawResults.some((song: any) => song?.url && !song.error)) {
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({ cachedAt: Date.now(), songs: rawResults }),
            );
          }
        }

        const mergedPlaylist = rawResults
          .filter((song: any) => song && song.url && !song.error)
          .map((song: any) => ({
            id: song.id || Math.random().toString(),
            title: song.name || "未知歌曲",
            artist: song.artist || song.author || "未知歌手",
            cover: song.cover || song.pic || "/atelier/mark.svg",
            src: song.url,
            lrcUrl: song.lrc ? null : `/api/music?lyricId=${song.id}`,
            lyrics: song.lrc ? parseLrc(song.lrc) : [],
          }));

        if (isMounted) {
          if (mergedPlaylist.length > 0) {
            setPlaylist(mergedPlaylist);
            setCurrentIndex((index) =>
              Math.min(index, mergedPlaylist.length - 1),
            );
          } else {
            const rateLimited = rawResults.some(
              (song: any) => song?.error === "rate_limited",
            );
            const message = rateLimited
              ? "网易云暂时限流，请稍后重试"
              : "当前歌单暂时无法读取";
            setPlaylist([]);
            setLoadError(message);
            setCurrentLyric(message);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setPlaylist([]);
          setLoadError("音乐服务连接失败，请稍后重试");
          setCurrentLyric("音乐服务连接失败，请稍后重试");
          setIsLoading(false);
        }
      }
    };

    if (siteConfig.cloudMusicIds?.length > 0) fetchMusicData();
    else setIsLoading(false);

    return () => {
      isMounted = false;
    };
  }, [retryKey, musicRequested]);

  useEffect(() => {
    if (playlist.length === 0) return;
    if (!musicRequested) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setLyrics([]);
    setCurrentLyric("♪ 正在缓冲 ♪");
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      if (isMounted) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(
          currentSong.lyrics[0]?.text ||
            "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a",
        );
      }
    } else if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`歌词接口返回 ${res.status}`);
          return res.text();
        })
        .then((text) => {
          if (isMounted) {
            const parsed = parseLrc(text);
            setLyrics(parsed);
            setCurrentLyric(parsed[0]?.text || "♪ 纯享音乐 ♪");
            setPlaylist((prev) => {
              const newPlaylist = [...prev];
              newPlaylist[currentIndex].lyrics = parsed;
              return newPlaylist;
            });
          }
        })
        .catch(() => {
          if (isMounted)
            setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
        });
    }

    playAttempt.current += 1;
    setIsPlaying(false);
    setIsBuffering(false);
    setPlaybackError("");
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    if (wantsToPlay.current && audioRef.current) requestPlay(audioRef.current);
    return () => {
      isMounted = false;
    };
  }, [currentIndex, playlist.length, playlist[currentIndex]?.src]);

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (wantsToPlay.current) pausePlayback();
      else requestPlay(audioRef.current);
    }
  };

  const changeSong = (index: number, play = wantsToPlay.current) => {
    if (!playlist[index]) return;
    wantsToPlay.current = play;
    playAttempt.current += 1;
    setPlaybackError("");
    if (index === currentIndex && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      if (play) requestPlay(audioRef.current);
      return;
    }
    setIsPlaying(false);
    setIsBuffering(play);
    setCurrentIndex(index);
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (!playlist.length) return;
    if (playMode === "random") {
      changeSong(Math.floor(Math.random() * playlist.length));
    } else {
      changeSong((currentIndex + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (!playlist.length) return;
    if (playMode === "random") {
      changeSong(Math.floor(Math.random() * playlist.length));
    } else {
      changeSong((currentIndex - 1 + playlist.length) % playlist.length);
    }
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    changeSong(index, true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyric = lyrics
          .slice()
          .reverse()
          .find((l) => currentTime >= l.time);
        if (activeLyric && activeLyric.text !== currentLyric) {
          setCurrentLyric(activeLyric.text);
        }
      }
    }
  };

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    setIsPlaying(false);
    setIsBuffering(false);
    if (playMode === "single" && audioRef.current) {
      audioRef.current.currentTime = 0;
      requestPlay(audioRef.current);
    } else {
      nextSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime =
        (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode((prev) => {
      if (prev === "loop") return "single";
      if (prev === "single") return "random";
      return "loop";
    });
  };

  const retryMusic = () => {
    pausePlayback();
    setPlaybackError("");
    setRetryKey((value) => value + 1);
  };

  const currentSong = playlist[currentIndex];

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentIndex,
        currentSong,
        isPlaying,
        isBuffering,
        playbackError,
        progress,
        currentTime,
        duration,
        currentLyric,
        isLoading,
        loadError,
        volume,
        isMuted,
        playMode, // 暴露新状态
        togglePlay,
        nextSong,
        prevSong,
        handleSeek,
        playSong,
        setVolume,
        toggleMute,
        togglePlayMode,
        retryMusic, // 暴露新方法
      }}
    >
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          preload="metadata"
          onPlaying={() => {
            if (!wantsToPlay.current) { audioRef.current?.pause(); return; }
            setIsPlaying(true);
            setIsBuffering(false);
            setPlaybackError("");
          }}
          onPause={(event) => {
            const audio = event.currentTarget;
            if (!audio.paused) return;
            // A source replacement also pauses the element. Keep that pending
            // track's intent, but respect a native/browser pause of this track.
            if (!audio.ended && audio.readyState > 0 && audio.currentSrc === new URL(currentSong.src, window.location.href).href) {
              wantsToPlay.current = false;
            }
            setIsPlaying(false);
            setIsBuffering(false);
          }}
          onWaiting={() => {
            if (wantsToPlay.current) { setIsPlaying(false); setIsBuffering(true); }
          }}
          onError={() => {
            wantsToPlay.current = false;
            playAttempt.current += 1;
            setIsPlaying(false);
            setIsBuffering(false);
            setPlaybackError("这首歌暂时无法播放，可以重试或换一首。");
          }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} // 使用我们重写的结束处理
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
