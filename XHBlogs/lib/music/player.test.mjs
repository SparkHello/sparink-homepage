import assert from "node:assert/strict";
import test from "node:test";
import { MusicPlayer, adjacentTrack } from "./player.ts";
import { normalizePlaylist } from "./model.ts";

class FakeAudio extends EventTarget {
  src = "";
  preload = "auto";
  autoplay = true;
  volume = 1;
  muted = false;
  paused = true;
  ended = false;
  readyState = 0;
  currentTime = 0;
  duration = Number.NaN;
  error = null;
  attempts = [];
  loads = 0;
  bindings = new Map();
  addEventListener(name, handler) {
    this.bindings.set(name, handler);
    super.addEventListener(name, handler);
  }
  removeEventListener(name, handler) {
    this.bindings.delete(name);
    super.removeEventListener(name, handler);
  }
  play() {
    this.paused = false;
    return new Promise((resolve, reject) => this.attempts.push({ resolve, reject }));
  }
  pause() { this.paused = true; }
  load() {
    this.loads++;
    this.paused = true;
    this.ended = false;
    this.readyState = 0;
    this.currentTime = 0;
    this.duration = Number.NaN;
    this.error = null;
  }
  removeAttribute(name) { if (name === "src") this.src = ""; }
  emit(name) { this.dispatchEvent(new Event(name)); }
}

const tracks = normalizePlaylist([1, 2, 3].map((id) => ({ id, name: `Song ${id}`, url: "https://example.com/shared.mp3" })), ["1", "2", "3"]);

function setup(count = 3) {
  const audios = [];
  const player = new MusicPlayer(() => {
    const audio = new FakeAudio();
    audios.push(audio);
    return audio;
  });
  player.setPlaylist(tracks.slice(0, count));
  return { player, audios, current: () => audios.at(-1) };
}

const settle = () => new Promise((resolve) => queueMicrotask(resolve));

test("initial selection does not autoplay and settings are applied to a newly created audio element", () => {
  const audios = [];
  const player = new MusicPlayer(() => { const audio = new FakeAudio(); audios.push(audio); return audio; });
  player.setVolume(0.3);
  player.toggleMute();
  assert.equal(audios.length, 0);
  player.setPlaylist(tracks);
  assert.equal(audios[0].autoplay, false);
  assert.equal(audios[0].preload, "none");
  assert.equal(audios[0].volume, 0.3);
  assert.equal(audios[0].muted, true);
  assert.equal(audios[0].attempts.length, 0);
  assert.equal(player.getSnapshot().isPlaying, false);
});

test("play intent remains buffering until actual playback, including a fulfilled promise without an event", async () => {
  const { player, current } = setup();
  player.togglePlay();
  assert.equal(player.getSnapshot().isBuffering, true);
  assert.equal(player.getSnapshot().isPlaying, false);
  current().readyState = 4;
  current().attempts[0].resolve();
  await settle();
  assert.equal(player.getSnapshot().isPlaying, true);
  assert.equal(player.getSnapshot().isBuffering, false);
  current().readyState = 2;
  current().emit("waiting");
  assert.equal(player.getSnapshot().isPlaying, false);
  current().readyState = 4;
  current().emit("playing");
  assert.equal(player.getSnapshot().isPlaying, true);
  current().emit("stalled");
  assert.equal(player.getSnapshot().isBuffering, false);
});

test("cancelled and superseded play promises cannot resume playback or overwrite a newer attempt", async () => {
  const { player, current } = setup();
  player.togglePlay();
  player.togglePlay();
  current().readyState = 4;
  current().attempts[0].resolve();
  await settle();
  assert.equal(player.getSnapshot().isPlaying, false);
  assert.equal(player.getSnapshot().isBuffering, false);
  player.togglePlay();
  player.togglePlay();
  player.togglePlay();
  current().attempts[1].reject(new Error("stale failure"));
  current().attempts[2].resolve();
  await settle();
  assert.equal(player.getSnapshot().playbackError, "");
  assert.equal(player.getSnapshot().isPlaying, true);
});

test("queued pause after a quick resume cannot cancel the new play request", async () => {
  const { player, current } = setup();
  player.togglePlay();
  player.togglePlay();
  player.togglePlay();
  current().emit("pause");
  current().readyState = 4;
  current().attempts[1].resolve();
  await settle();
  assert.equal(player.getSnapshot().isPlaying, true);
});

test("rapid selection isolates old callbacks and promises while reusing the element for Safari", async () => {
  const { player, current, audios } = setup();
  player.togglePlay();
  const old = current();
  const oldPlaying = old.bindings.get("playing");
  const oldPromise = old.attempts[0];
  player.playSong(1);
  assert.equal(old.loads, 1);
  assert.equal(audios.length, 1);
  assert.equal(current().src, tracks[1].url);
  current().emit("pause");
  current().emit("playing");
  current().emit("ended");
  oldPlaying();
  oldPromise.resolve();
  await settle();
  assert.equal(player.getSnapshot().currentIndex, 1);
  assert.equal(player.getSnapshot().currentTime, 0);
  assert.equal(player.getSnapshot().isPlaying, false);
  current().readyState = 4;
  current().attempts.at(-1).resolve();
  await settle();
  assert.equal(player.getSnapshot().isPlaying, true);
});

test("natural ending advances or repeats, while manual next still advances in single mode", () => {
  const { player, current } = setup();
  player.togglePlay();
  current().ended = true;
  current().paused = true;
  current().emit("pause");
  current().emit("ended");
  assert.equal(player.getSnapshot().currentIndex, 1);
  assert.equal(current().attempts.length, 2);
  player.togglePlayMode();
  const loads = current().loads;
  current().ended = true;
  current().emit("ended");
  assert.equal(player.getSnapshot().currentIndex, 1);
  assert.equal(current().loads, loads + 1);
  player.nextSong();
  assert.equal(player.getSnapshot().currentIndex, 2);
});

test("one-track lists restart on end and next without depending on a source URL change", () => {
  const { player, current } = setup(1);
  player.togglePlay();
  const original = current();
  current().currentTime = 100;
  current().ended = true;
  current().emit("ended");
  assert.equal(original, current());
  assert.equal(current().currentTime, 0);
  const loads = current().loads;
  player.nextSong();
  assert.equal(current().loads, loads + 1);
  assert.equal(player.getSnapshot().currentIndex, 0);
  assert.equal(current().attempts.length, 3);
});

test("media errors stop playback and retry uses a fresh session with current volume", async () => {
  const { player, current } = setup();
  player.togglePlay();
  const broken = current();
  broken.error = { code: 2 };
  broken.emit("error");
  broken.attempts[0].reject(new Error("network failed"));
  await settle();
  assert.equal(player.getSnapshot().isBuffering, false);
  assert.ok(player.getSnapshot().playbackError);
  player.setVolume(0.4);
  const loads = broken.loads;
  player.togglePlay();
  assert.equal(current().loads, loads + 1);
  assert.equal(current().error, null);
  assert.equal(current().volume, 0.4);
  current().attempts.at(-1).reject(new DOMException("Blocked", "NotAllowedError"));
  await settle();
  assert.match(player.getSnapshot().playbackError, /浏览器/);
  assert.equal(player.getSnapshot().isPlaying, false);
  assert.equal(player.getSnapshot().isBuffering, false);
});

test("seek and volume reject non-finite input and clamp accepted values", () => {
  const { player, current } = setup();
  player.seek(50);
  assert.equal(current().currentTime, 0);
  current().duration = 120;
  current().emit("loadedmetadata");
  player.seek(50);
  assert.equal(player.getSnapshot().currentTime, 60);
  player.seek(200);
  assert.equal(current().currentTime, 120);
  player.seek(Number.NaN);
  assert.equal(current().currentTime, 120);
  player.setVolume(-2);
  assert.equal(current().volume, 0);
  player.setVolume(Number.NaN);
  assert.equal(current().volume, 0);
  player.setVolume(2);
  assert.equal(current().volume, 1);
});

test("random selection excludes the current track; list navigation wraps", () => {
  for (let index = 0; index < 3; index++) {
    for (const sample of [0, 0.2, 0.5, 0.99, 1]) {
      const selected = adjacentTrack(index, 3, "random", 1, false, () => sample);
      assert.notEqual(selected, index);
      assert.ok(selected >= 0 && selected < 3);
    }
  }
  assert.equal(adjacentTrack(0, 3, "loop", -1), 2);
  assert.equal(adjacentTrack(2, 3, "loop", 1), 0);
  assert.equal(adjacentTrack(0, 1, "random", 1), 0);
});

test("dispose invalidates a pending play and releases the source", async () => {
  const { player, current } = setup();
  player.togglePlay();
  const audio = current();
  player.dispose();
  audio.readyState = 4;
  audio.paused = false;
  audio.attempts[0].resolve();
  await settle();
  assert.equal(audio.src, "");
  assert.equal(player.getSnapshot().isPlaying, false);
  assert.equal(player.getSnapshot().isBuffering, false);
});
