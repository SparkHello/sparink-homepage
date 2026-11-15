import assert from "node:assert/strict";
import test from "node:test";
import { normalizePlaylist, encodePlaylistCache, decodePlaylistCache, PLAYLIST_CACHE_AGE, parseLyrics, lyricAt } from "./model.ts";

const ids = ["12", "34"];
const rows = [
  { id: 12, name: "First", artist: "Artist", pic: "https://example.com/cover.jpg", url: "https://example.com/12.mp3" },
  { id: "34", title: "Second", author: "Other", url: "/music/34.mp3" },
];

test("playlist boundary restores configured order and rejects foreign, duplicate and unusable rows", () => {
  const tracks = normalizePlaylist([
    rows[1], { id: "12", url: "javascript:alert(1)" }, rows[0], rows[0],
    { id: "56", url: "https://example.com/56.mp3" }, { id: "78", error: "not_found" }, null,
  ], ids);
  assert.deepEqual(tracks.map((track) => track.id), ids);
  assert.equal(tracks[0].title, "First");
  assert.equal(tracks[0].cover, "https://example.com/cover.jpg");
  assert.equal(tracks[1].artist, "Other");
  assert.equal(tracks[1].url, "/music/34.mp3");
  assert.deepEqual(normalizePlaylist({ songs: rows }, ids), []);
  for (const url of ["data:audio/mpeg;base64,eA==", "//evil.example/file", "/\\evil.example/file", "https://name:secret@example.com/file"]) {
    assert.deepEqual(normalizePlaylist([{ id: "12", url }], ids), []);
  }
});

test("cache requires matching configuration, supported version, valid age, and every saved row", () => {
  const tracks = normalizePlaylist(rows, ids);
  const now = 5_000_000_000;
  const encoded = encodePlaylistCache(tracks, ids, now);
  assert.deepEqual(decodePlaylistCache(encoded, ids, now + 1), tracks);
  assert.equal(decodePlaylistCache(encoded, [...ids].reverse(), now), null);
  assert.equal(decodePlaylistCache(encoded, ids, now + PLAYLIST_CACHE_AGE), null);
  assert.equal(decodePlaylistCache(encoded, ids, now - 1), null);
  for (const patch of [
    { version: 2 }, { savedAt: null }, { tracks: [] },
    { tracks: [tracks[0], tracks[0]] },
    { tracks: [tracks[0], { ...tracks[1], url: "file:///music.mp3" }] },
    { tracks: [tracks[0], { ...tracks[1], title: 42 }] },
  ]) {
    assert.equal(decodePlaylistCache(JSON.stringify({ ...JSON.parse(encoded), ...patch }), ids, now), null);
  }
  assert.equal(decodePlaylistCache("not json", ids, now), null);
});

test("LRC uses fractional precision, expands repeated timestamps, sorts and ignores malformed seconds", () => {
  const lines = parseLyrics("[ar:Artist]\n[01:02.125]Later\n[00:01.2][00:02.25] One\u0000\u200b \n[00:99.00]Invalid\n[00:03]Three");
  assert.deepEqual(lines, [
    { time: 1.2, text: "One" }, { time: 2.25, text: "One" },
    { time: 3, text: "Three" }, { time: 62.125, text: "Later" },
  ]);
  assert.equal(lyricAt(lines, 0), "");
  assert.equal(lyricAt(lines, 2.25), "One");
  assert.equal(lyricAt(lines, 3), "Three");
  assert.equal(lyricAt(lines, 100), "Later");
  assert.equal(lyricAt(lines, 1.2), "One");
  assert.equal(lyricAt(lines, Number.NaN), "");
  assert.deepEqual(parseLyrics("x".repeat(100_001)), []);
});
