import type { MusicTrack, PlayMode } from "./model";

export interface PlayerSnapshot {
  hasRequested: boolean;
  playlist: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackError: string;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
}

type AudioPort = Pick<HTMLAudioElement,
  "src" | "preload" | "autoplay" | "volume" | "muted" | "paused" | "ended" | "readyState"
  | "currentTime" | "duration" | "error" | "play" | "pause" | "load" | "removeAttribute"
  | "addEventListener" | "removeEventListener"
>;

interface AudioSession {
  audio: AudioPort;
  removeListeners: () => void;
}

export function adjacentTrack(index: number, count: number, mode: PlayMode, direction: -1 | 1, ended = false, random = Math.random): number {
  if (count <= 1) return 0;
  if (ended && mode === "single") return index;
  if (mode === "random") {
    const sample = Math.max(0, Math.min(0.999999999, random()));
    const candidate = Math.floor(sample * (count - 1));
    return candidate >= index ? candidate + 1 : candidate;
  }
  return (index + direction + count) % count;
}

/** Keep Safari's per-element playback permission, but isolate every source selection in its own session. */
export class MusicPlayer {
  private state: PlayerSnapshot = {
    hasRequested: false, playlist: [], currentIndex: 0, isPlaying: false, isBuffering: false, playbackError: "",
    currentTime: 0, duration: 0, volume: 1, isMuted: false, playMode: "loop",
  };
  private listeners = new Set<() => void>();
  private session: AudioSession | null = null;
  private audio: AudioPort | null = null;
  private wantsPlayback = false;
  private attempt = 0;
  private createAudio: () => AudioPort;

  constructor(createAudio: () => AudioPort) {
    this.createAudio = createAudio;
  }

  getSnapshot = (): PlayerSnapshot => this.state;
  activate = () => { if (!this.state.hasRequested) this.update({ hasRequested: true }); };
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(patch: Partial<PlayerSnapshot>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private release() {
    this.attempt++;
    this.wantsPlayback = false;
    const previous = this.session;
    this.session = null;
    if (!previous) return;
    previous.removeListeners();
    previous.audio.pause();
    previous.audio.removeAttribute("src");
    previous.audio.load();
  }

  dispose = () => {
    this.release();
    this.audio = null;
    this.update({ isPlaying: false, isBuffering: false });
  };

  setPlaylist = (playlist: MusicTrack[]) => {
    this.release();
    this.update({ playlist, currentIndex: 0, currentTime: 0, duration: 0, isPlaying: false, isBuffering: false, playbackError: "" });
    if (playlist.length) this.select(0, false);
  };

  private select(index: number, start: boolean) {
    const track = this.state.playlist[index];
    if (!Number.isInteger(index) || !track) return;
    this.release();
    const audio = this.audio ?? this.createAudio();
    this.audio = audio;
    audio.autoplay = false;
    audio.preload = "none";
    audio.volume = this.state.volume;
    audio.muted = this.state.isMuted;
    const bindings: Array<[string, EventListener]> = [];
    const session: AudioSession = {
      audio,
      removeListeners: () => bindings.forEach(([name, handler]) => audio.removeEventListener(name, handler)),
    };
    this.session = session;
    const on = (name: string, action: () => void) => {
      const handler = () => { if (this.session === session) action(); };
      audio.addEventListener(name, handler);
      bindings.push([name, handler]);
    };
    const timing = () => this.update({
      currentTime: Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0,
      duration: Number.isFinite(audio.duration) ? Math.max(0, audio.duration) : 0,
    });
    const confirmPlaying = () => {
      if (!this.wantsPlayback) { audio.pause(); return; }
      if (!audio.paused && !audio.ended && audio.readyState >= 3) {
        this.update({ isPlaying: true, isBuffering: false, playbackError: "" });
      }
    };
    on("playing", confirmPlaying);
    on("seeked", () => { timing(); confirmPlaying(); });
    for (const event of ["waiting", "stalled", "seeking"]) on(event, () => {
      if (this.wantsPlayback && !audio.paused && (event === "seeking" || audio.readyState < 3)) {
        this.update({ isPlaying: false, isBuffering: true });
      }
    });
    on("pause", () => {
      // pause is queued: a new play() call may already have resumed this element.
      if (!audio.paused || audio.ended) return;
      this.wantsPlayback = false;
      this.attempt++;
      this.update({ isPlaying: false, isBuffering: false });
    });
    on("ended", () => {
      if (!audio.ended || !this.wantsPlayback) return;
      this.select(adjacentTrack(this.state.currentIndex, this.state.playlist.length, this.state.playMode, 1, true), true);
    });
    on("error", () => {
      if (audio.error) this.fail("这首歌暂时无法播放，可以重试或换一首。");
    });
    for (const event of ["timeupdate", "loadedmetadata", "durationchange"]) on(event, timing);
    audio.src = track.url;
    this.update({ currentIndex: index, currentTime: 0, duration: 0, isPlaying: false, isBuffering: false, playbackError: "" });
    if (start) this.start();
  }

  private fail(message: string) {
    this.wantsPlayback = false;
    this.attempt++;
    this.session?.audio.pause();
    this.update({ isPlaying: false, isBuffering: false, playbackError: message });
  }

  private start() {
    const session = this.session;
    if (!session) return;
    if (session.audio.error || session.audio.ended) { this.select(this.state.currentIndex, true); return; }
    const attempt = ++this.attempt;
    this.wantsPlayback = true;
    this.update({ isPlaying: false, isBuffering: true, playbackError: "" });
    const isCurrent = () => this.session === session && this.attempt === attempt && this.wantsPlayback;
    const rejected = (error: unknown) => {
      if (!isCurrent()) return;
      this.fail(error instanceof Error && error.name === "NotAllowedError"
        ? "浏览器暂停了播放，请再点一下播放。"
        : "这首歌暂时无法播放，可以重试或换一首。");
    };
    try {
      void session.audio.play().then(() => {
        if (isCurrent() && !session.audio.paused && !session.audio.ended && session.audio.readyState >= 3) {
          this.update({ isPlaying: true, isBuffering: false, playbackError: "" });
        }
      }, rejected);
    } catch (error: unknown) {
      rejected(error);
    }
  }

  togglePlay = () => {
    if (this.wantsPlayback) {
      this.wantsPlayback = false;
      this.attempt++;
      this.session?.audio.pause();
      this.update({ isPlaying: false, isBuffering: false });
    } else this.start();
  };

  playSong = (index: number) => { this.select(index, true); };
  nextSong = () => { this.select(adjacentTrack(this.state.currentIndex, this.state.playlist.length, this.state.playMode, 1), true); };
  prevSong = () => { this.select(adjacentTrack(this.state.currentIndex, this.state.playlist.length, this.state.playMode, -1), true); };
  togglePlayMode = () => {
    const next: Record<PlayMode, PlayMode> = { loop: "single", single: "random", random: "loop" };
    this.update({ playMode: next[this.state.playMode] });
  };
  setVolume = (value: number) => {
    if (!Number.isFinite(value)) return;
    const volume = Math.max(0, Math.min(1, value));
    if (this.session) { this.session.audio.volume = volume; this.session.audio.muted = false; }
    this.update({ volume, isMuted: false });
  };
  toggleMute = () => {
    const isMuted = !this.state.isMuted;
    if (this.session) this.session.audio.muted = isMuted;
    this.update({ isMuted });
  };
  seek = (percent: number) => {
    const audio = this.session?.audio;
    if (!audio || !Number.isFinite(percent) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      audio.currentTime = audio.duration * Math.max(0, Math.min(100, percent)) / 100;
      this.update({ currentTime: audio.currentTime });
    } catch {
      // A source without a seekable range can reject a seek while its metadata changes.
    }
  };
}
