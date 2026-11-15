"use client";

import { useMemo, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Repeat1,
  RefreshCw,
  Volume2,
  VolumeX,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { useMusic } from "../../components/MusicProvider";
import "../../components/atelier/extras.css";

function time(value: number) {
  return Number.isFinite(value) && value > 0
    ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`
    : "0:00";
}

export default function MusicClient() {
  const music = useMusic();
  const [query, setQuery] = useState("");
  const [coverFailed, setCoverFailed] = useState("");
  const tracks = useMemo(
    () =>
      music.playlist
        .map((song, index) => ({ song, index }))
        .filter(({ song }) =>
          `${song.title || song.name || ""} ${song.artist || song.author || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [music.playlist, query],
  );
  const song = music.currentSong;
  const cover = song?.cover || song?.pic;
  const mode = { loop: "列表循环", single: "单曲循环", random: "随机播放" }[
    music.playMode
  ];
  const ModeIcon =
    music.playMode === "random"
      ? Shuffle
      : music.playMode === "single"
        ? Repeat1
        : Repeat;
  return (
    <main className="page-wrap extra-page listening-page quiet-page">
      <header className="extra-heading">
        <h1>听听歌</h1>
        <p>一些喜欢听的歌。</p>
      </header>
      <div className="listening-layout">
        <div className="record-player">
          <div className={`record-art ${music.isPlaying ? "is-playing" : ""}`}>
            <div className="record-rings" />
            <div className="record-label">
              {cover && coverFailed !== cover ? (
                <img
                  src={cover}
                  alt={song?.title || song?.name || "唱片封面"}
                  onError={() => setCoverFailed(cover)}
                />
              ) : (
                <span>
                  SP
                  <br />
                  IN.
                </span>
              )}
            </div>
            <span className="record-center" />
          </div>
          <div className="record-description">
            <span className="extra-mono">
              {music.isLoading
                ? "正在连接"
                : music.isPlaying
                  ? "正在播放"
                  : "点一下播放"}
            </span>
            <h2>
              {song?.title ||
                song?.name ||
                (music.isLoading ? "正在载入歌单…" : "歌单暂时不可用")}
            </h2>
            <p>{song?.artist || song?.author || "我的歌单"}</p>
          </div>
          {song && (
            <>
              <label className="record-progress">
                <span className="sr-only">播放进度</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={Number.isFinite(music.progress) ? music.progress : 0}
                  onChange={music.handleSeek}
                />
                <span>{time(music.currentTime)}</span>
                <span>{time(music.duration)}</span>
              </label>
              <div className="record-controls">
                <button
                  type="button"
                  aria-label={`播放模式：${mode}，点击切换`}
                  title={mode}
                  onClick={music.togglePlayMode}
                >
                  <ModeIcon size={19} />
                </button>
                <button
                  type="button"
                  onClick={music.prevSong}
                  aria-label="上一首"
                >
                  <SkipBack size={22} />
                </button>
                <button
                  type="button"
                  className="record-play"
                  onClick={music.togglePlay}
                  aria-label={music.isPlaying ? "暂停" : "播放"}
                >
                  {music.isPlaying ? <Pause size={23} /> : <Play size={23} />}
                </button>
                <button
                  type="button"
                  onClick={music.nextSong}
                  aria-label="下一首"
                >
                  <SkipForward size={22} />
                </button>
                <button
                  type="button"
                  onClick={music.toggleMute}
                  aria-label={music.isMuted ? "取消静音" : "静音"}
                >
                  {music.isMuted ? (
                    <VolumeX size={19} />
                  ) : (
                    <Volume2 size={19} />
                  )}
                </button>
              </div>
              <label className="record-volume">
                <span>音量</span>
                <input
                  aria-label="音量"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={music.isMuted ? 0 : music.volume}
                  onChange={(event) =>
                    music.setVolume(Number(event.target.value))
                  }
                />
              </label>
              <p className="record-lyric" aria-live="off">
                {music.currentLyric}
              </p>
            </>
          )}
          {!song && (
            <div className="record-error" role="status">
              <p>
                {music.isLoading
                  ? "正在连接音乐服务。"
                  : music.loadError || "歌单暂时不可用，请稍后重试。"}
              </p>
              {!music.isLoading && (
                <button
                  type="button"
                  onClick={music.retryMusic}
                  className="text-link"
                >
                  <RefreshCw size={16} />
                  重新连接
                </button>
              )}
            </div>
          )}
        </div>
        <div className="track-panel">
          <div className="track-heading">
            <h2>歌单</h2>
            <span className="extra-mono">
              {music.playlist.length} 首
            </span>
          </div>
          <label className="journal-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="搜索歌曲或歌手"
              placeholder="搜索歌曲或歌手…"
            />
          </label>
          {tracks.length ? (
            <div className="track-list">
              {tracks.map(({ song: track, index }) => (
                <button
                  key={`${track.id}-${index}`}
                  type="button"
                  className={`track-row ${index === music.currentIndex ? "is-current" : ""}`}
                  onClick={() =>
                    index === music.currentIndex
                      ? music.togglePlay()
                      : music.playSong(index)
                  }
                  aria-label={`${index === music.currentIndex && music.isPlaying ? "暂停" : "播放"} ${track.title || track.name}`}
                >
                  <span className="track-number extra-mono">
                    {index === music.currentIndex && music.isPlaying ? (
                      <span className="equalizer" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="track-name">
                    <strong>{track.title || track.name || "未命名曲目"}</strong>
                    <span>{track.artist || track.author || "未知艺术家"}</span>
                  </span>
                  <span className="track-action">
                    {index === music.currentIndex && music.isPlaying ? (
                      <Pause size={17} />
                    ) : (
                      <Play size={17} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="track-empty">
              <p>
                {query
                  ? "没有找到这首歌。"
                  : music.isLoading
                    ? "正在载入歌单…"
                    : "暂时无法读取歌单。"}
              </p>
              {query && (
                <button className="text-link" onClick={() => setQuery("")}>
                  清除搜索 <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
