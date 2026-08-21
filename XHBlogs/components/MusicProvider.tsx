"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

// 【增强版 LRC 歌词解析】
type LyricLine = { time: number; text: string };

type MusicSong = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover: string;
  src?: string;
  lrcUrl?: string | null;
  lyrics: LyricLine[];
  lrc?: string;
  lyric?: string;
  name?: string;
  author?: string;
  pic?: string;
  sourceLabel?: string;
  isLocalMirror?: boolean;
};

type MusicApiSong = {
  id?: string;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  url?: string;
  lrc?: string;
  error?: string;
};

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

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
type PlayMode = 'loop' | 'single' | 'random';

type LocalNowPlaying = {
  available: boolean;
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
  duration?: number;
  currentTime?: number;
  isPlaying?: boolean;
  positionMode?: 'reported' | 'estimated';
  lrc?: string;
};

const LOCAL_MUSIC_BRIDGE = 'http://127.0.0.1:3210';

interface MusicContextType {
  playlist: MusicSong[];
  currentIndex: number;
  currentSong?: MusicSong;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
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
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接高可用神经云端...");
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');
  const [localSong, setLocalSong] = useState<MusicSong | null>(null);
  const [isLocalMirror, setIsLocalMirror] = useState(false);
  const localTrackKeyRef = useRef('');

  const audioRef = useRef<HTMLAudioElement>(null);

  const sendLocalControl = async (action: 'toggle' | 'next' | 'previous' | 'seek', value?: number) => {
    try {
      await fetch(`${LOCAL_MUSIC_BRIDGE}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
    } catch {
      setIsLocalMirror(false);
      setLocalSong(null);
    }
  };

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pollLocalMusic = async () => {
      try {
        const response = await fetch(`${LOCAL_MUSIC_BRIDGE}/now-playing`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Local bridge unavailable');
        const data: LocalNowPlaying = await response.json();

        if (!cancelled && data.available && data.title) {
          const trackKey = `${data.id || data.title}\u0000${data.artist || ''}`;
          const parsed = data.lrc ? parseLrc(data.lrc) : [];
          const nextLocalSong: MusicSong = {
            id: data.id || trackKey,
            title: data.title,
            artist: data.artist || '未知歌手',
            album: data.album || '',
            cover: data.cover || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
            lyrics: parsed,
            lrc: data.lrc || '',
            sourceLabel: data.positionMode === 'estimated' ? 'QQ Music · 本地估算' : 'QQ Music · 本地同步',
            isLocalMirror: true,
          };
          setIsLocalMirror(true);
          setIsPlaying(Boolean(data.isPlaying));
          setCurrentTime(Number(data.currentTime) || 0);
          setDuration(Number(data.duration) || 0);
          setProgress(((Number(data.currentTime) || 0) / (Number(data.duration) || 1)) * 100);

          if (trackKey !== localTrackKeyRef.current) {
            localTrackKeyRef.current = trackKey;
            setLocalSong(nextLocalSong);
            setLyrics(parsed);
            setCurrentLyric(parsed[0]?.text || '♪ QQ 音乐本地同步 ♪');
          } else {
            // Preserve the parsed lyrics array between one-second progress polls.
            setLocalSong((previous) => previous ? {
              ...nextLocalSong,
              lyrics: previous.lyrics,
              lrc: previous.lrc,
            } : nextLocalSong);
          }
        } else if (!cancelled) {
          setIsLocalMirror(false);
          setLocalSong(null);
          localTrackKeyRef.current = '';
        }
      } catch {
        if (!cancelled) {
          setIsLocalMirror(false);
          setLocalSong(null);
          localTrackKeyRef.current = '';
        }
      } finally {
        if (!cancelled) timer = setTimeout(pollLocalMusic, 1000);
      }
    };

    pollLocalMusic();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isLocalMirror || lyrics.length === 0) return;
    const activeLyric = lyrics.slice().reverse().find((line) => currentTime >= line.time);
    if (activeLyric && activeLyric.text !== currentLyric) setCurrentLyric(activeLyric.text);
  }, [isLocalMirror, currentTime, lyrics, currentLyric]);

  useEffect(() => {
    let isMounted = true;
    const fetchMusicData = async () => {
      try {
        const res = await fetch(`/api/music?ids=${siteConfig.cloudMusicIds.join(',')}`);
        const rawResults: MusicApiSong[] = await res.json();

        const mergedPlaylist = rawResults
          .filter((song) => song && song.url && !song.error)
          .map((song): MusicSong => ({
            id: song.id || Math.random().toString(),
            title: song.name || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            cover: song.cover || song.pic || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
            src: song.url,
            lrcUrl: null,
            lyrics: song.lrc ? parseLrc(song.lrc) : []
          }));

        if (isMounted) {
          if (mergedPlaylist.length > 0) setPlaylist(mergedPlaylist);
          else setCurrentLyric("云端链路受阻");
          setIsLoading(false);
        }
      } catch {
        if (isMounted) { setCurrentLyric("网络初始化失败"); setIsLoading(false); }
      }
    };

    if (siteConfig.cloudMusicIds?.length > 0) fetchMusicData();
    else setIsLoading(false);

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isLocalMirror || playlist.length === 0) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setLyrics([]);
    setCurrentLyric("♪ 正在缓冲 ♪");
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      if (isMounted) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(currentSong.lyrics[0]?.text || "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      }
    } else if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then(res => res.text())
        .then(text => {
          if (isMounted) {
             const parsed = parseLrc(text);
             setLyrics(parsed);
             setPlaylist(prev => {
                const newPlaylist = [...prev];
                newPlaylist[currentIndex].lyrics = parsed;
                return newPlaylist;
             });
          }
        })
        .catch(() => { if (isMounted) setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a"); });
    }

    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
    return () => { isMounted = false; };
  }, [currentIndex, isLocalMirror, isPlaying, playlist]);

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (isLocalMirror) {
      setIsPlaying((playing) => !playing);
      void sendLocalControl('toggle');
      return;
    }
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    }
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (isLocalMirror) {
      void sendLocalControl('next');
      return;
    }
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (isLocalMirror) {
      void sendLocalControl('previous');
      return;
    }
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    if (isLocalMirror) return;
    setCurrentIndex(index);
    if (!isPlaying) setIsPlaying(true); // 保证切歌后自动播放
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyric = lyrics.slice().reverse().find(l => currentTime >= l.time);
        if (activeLyric && activeLyric.text !== currentLyric) {
          setCurrentLyric(activeLyric.text);
        }
      }
    }
  };

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play();
    } else {
       nextSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (isLocalMirror) {
      const targetTime = (newProgress / 100) * duration;
      setCurrentTime(targetTime);
      void sendLocalControl('seek', targetTime);
      return;
    }
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  const activePlaylist = isLocalMirror && localSong ? [localSong] : playlist;
  const activeIndex = isLocalMirror ? 0 : currentIndex;
  const currentSong = isLocalMirror && localSong ? localSong : playlist[currentIndex];

  return (
    <MusicContext.Provider value={{
        playlist: activePlaylist, currentIndex: activeIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        volume, isMuted, playMode, // 暴露新状态
        togglePlay, nextSong, prevSong, handleSeek,
        playSong, setVolume, toggleMute, togglePlayMode // 暴露新方法
    }}>
      {children}
      {currentSong && !isLocalMirror && (
        <audio
          ref={audioRef}
          src={currentSong.src}
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
