import assert from "node:assert/strict";
import test from "node:test";
import { createMusicHandler } from "./handler.ts";

const requestFor = (query) => new Request(`https://example.test/api/music?${query}`);
const song = (id, name = `Song ${id}`) => ({
  id,
  name,
  artists: [{ name: "Artist" }, { name: "Second artist" }],
  album: { picUrl: "https://example.test/cover.jpg" },
});

test("invalid requests never reach the upstream", async () => {
  let calls = 0;
  const handle = createMusicHandler({ fetch: async () => { calls++; throw new Error("Unexpected fetch"); } });
  const cases = [
    ["", "Missing ids parameter"],
    ["ids=", "Missing ids parameter"],
    ["ids=%20,,", "Invalid ids parameter"],
    ["ids=1,not-a-number", "Invalid ids parameter"],
    ["ids=123456789012345678901", "Invalid ids parameter"],
    [`ids=${Array.from({ length: 31 }, (_, i) => i + 1).join(",")}`, "Invalid ids parameter"],
    ["lyricId=abc&ids=1", "Invalid lyricId parameter"],
  ];
  for (const [query, error] of cases) {
    const response = await handle(requestFor(query));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error });
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(calls, 0);
});

test("batch results preserve requested order, aliases, and missing-song entries", async () => {
  let requestedUrl;
  const handle = createMusicHandler({ fetch: async (url, init) => {
    requestedUrl = url;
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json({ code: 200, songs: [song(1), song(2)] });
  } });
  const response = await handle(requestFor("ids=%202%20,1,,3,2"));
  const results = await response.json();
  assert.equal(response.status, 200);
  assert.equal(requestedUrl.origin, "https://music.163.com");
  assert.equal(requestedUrl.pathname, "/api/song/detail/");
  assert.equal(requestedUrl.searchParams.get("ids"), "[2,1,3]");
  assert.deepEqual(results.map((item) => item.id), ["2", "1", "3"]);
  assert.deepEqual(results[0], {
    id: "2", name: "Song 2", artist: "Artist", author: "Artist",
    cover: "https://example.test/cover.jpg", pic: "https://example.test/cover.jpg",
    url: "https://music.163.com/song/media/outer/url?id=2.mp3",
  });
  assert.deepEqual(results[2], { id: "3", error: "not_found" });
  assert.match(response.headers.get("cache-control"), /s-maxage=1800/);
});

test("supported ID limits retain precision and accept duplicate input beyond 30 items", async () => {
  const largeId = "12345678901234567890";
  const ids = Array.from({ length: 29 }, (_, i) => String(i + 1)).concat(largeId);
  const handle = createMusicHandler({ fetch: async (url) => {
    assert.equal(url.searchParams.get("ids"), `[${ids.join(",")}]`);
    return Response.json({ code: 200, songs: ids.map((id) => song(id)) });
  } });
  const response = await handle(requestFor(`ids=${ids.concat(ids).join(",")}`));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).map((item) => item.id), ids);
});

test("leading zero IDs remain stable for callers and produce valid upstream JSON", async () => {
  const handle = createMusicHandler({ fetch: async (url) => {
    assert.deepEqual(JSON.parse(url.searchParams.get("ids")), [1]);
    return Response.json({ code: 200, songs: [{ id: 1, name: "One" }] });
  } });
  const [result] = await (await handle(requestFor("ids=0001"))).json();
  assert.equal(result.id, "0001");
  assert.equal(result.artist, "未知歌手");
  assert.equal(result.cover, "");
});

test("lyricId takes precedence and returns unmodified plain text", async () => {
  const lyric = "[00:01.00]第一行\n[00:02.50]Second line";
  const handle = createMusicHandler({ fetch: async (url) => {
    assert.equal(url.pathname, "/api/song/lyric");
    assert.deepEqual(Object.fromEntries(url.searchParams), { id: "7", lv: "-1", kv: "-1", tv: "-1" });
    return Response.json({ code: 200, lrc: { lyric } });
  } });
  const response = await handle(requestFor("ids=invalid&lyricId=%207%20"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), lyric);
});

test("empty lyricId falls through to the song query", async () => {
  const handle = createMusicHandler({ fetch: async (url) => {
    assert.equal(url.pathname, "/api/song/detail/");
    return Response.json({ code: 200, songs: [song(1)] });
  } });
  assert.equal((await (await handle(requestFor("ids=1&lyricId=%20"))).json())[0].id, "1");
});

test("HTTP and payload rate limits keep the player error contract and are never cached", async () => {
  for (const upstream of [
    () => new Response(null, { status: 429 }),
    ...[405, 406, 429, 460].map((code) => () => Response.json({ code })),
  ]) {
    let calls = 0;
    const handle = createMusicHandler({ fetch: async () => { calls++; return upstream(); } });
    for (let attempt = 0; attempt < 2; attempt++) {
      const details = await handle(requestFor("ids=1,2"));
      assert.equal(details.status, 200);
      assert.deepEqual(await details.json(), [
        { id: "1", error: "rate_limited" }, { id: "2", error: "rate_limited" },
      ]);
      assert.equal(details.headers.get("cache-control"), "no-store");
    }
    const lyrics = await handle(requestFor("lyricId=1"));
    assert.equal(lyrics.status, 429);
    assert.deepEqual(await lyrics.json(), { error: "rate_limited" });
    assert.equal(calls, 3);
  }
});

test("malformed and unavailable upstreams become recoverable errors", async () => {
  for (const upstream of [
    () => new Response("Bad gateway", { status: 502 }),
    () => new Response("<html>not JSON</html>"),
    () => Response.json(null),
    () => Response.json({ code: 200, songs: "wrong shape" }),
    () => Response.json({ code: 200, songs: [{ id: 1, name: 42 }] }),
    () => { throw new TypeError("Network unavailable"); },
  ]) {
    let calls = 0;
    const handle = createMusicHandler({ fetch: async () => {
      calls++;
      return calls === 1 ? upstream() : Response.json({ code: 200, songs: [song(1)] });
    } });
    const failed = await handle(requestFor("ids=1"));
    assert.deepEqual(await failed.json(), [{ id: "1", error: "upstream_error" }]);
    assert.equal(failed.headers.get("cache-control"), "no-store");
    const retry = await handle(requestFor("ids=1"));
    assert.equal((await retry.json())[0].name, "Song 1");
    assert.equal(calls, 2);
  }
  const badLyrics = createMusicHandler({ fetch: async () => Response.json({ code: 200, lrc: { lyric: {} } }) });
  const response = await badLyrics(requestFor("lyricId=1"));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream_error" });
});

test("an upstream timeout terminates the request with a retryable lyric error", async () => {
  const handle = createMusicHandler({ timeoutMs: 5, fetch: async (_url, init) => new Promise((_resolve, reject) => {
    const guard = setTimeout(() => reject(new Error("Abort did not reach fetch")), 200);
    init.signal.addEventListener("abort", () => {
      clearTimeout(guard);
      reject(init.signal.reason);
    }, { once: true });
  }) });
  const response = await handle(requestFor("lyricId=1"));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream_error" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("empty lyrics are cached until the 30-minute expiry", async () => {
  let now = 100;
  let calls = 0;
  const handle = createMusicHandler({ now: () => now, fetch: async () => {
    calls++;
    return Response.json({ code: 200, nolyric: true });
  } });
  assert.equal(await (await handle(requestFor("lyricId=1"))).text(), "");
  now += 30 * 60 * 1000 - 1;
  assert.equal(await (await handle(requestFor("lyricId=1"))).text(), "");
  assert.equal(calls, 1);
  now++;
  await handle(requestFor("lyricId=1"));
  assert.equal(calls, 2);
});

test("simultaneous identical reads share one upstream request", async () => {
  let release;
  let calls = 0;
  const gate = new Promise((resolve) => { release = resolve; });
  const handle = createMusicHandler({ fetch: async () => {
    calls++;
    await gate;
    return Response.json({ code: 200, songs: [song(1)] });
  } });
  const first = handle(requestFor("ids=1"));
  const second = handle(requestFor("ids=1"));
  assert.equal(calls, 1);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(await a.json(), await b.json());
});

test("cache capacity is bounded and recent reads survive eviction", async () => {
  let calls = 0;
  const handle = createMusicHandler({ fetch: async () => {
    calls++;
    return Response.json({ code: 200, lrc: { lyric: "lyrics" } });
  } });
  for (let id = 1; id <= 128; id++) await handle(requestFor(`lyricId=${id}`));
  await handle(requestFor("lyricId=1"));
  await handle(requestFor("lyricId=129"));
  await handle(requestFor("lyricId=1"));
  assert.equal(calls, 129);
  await handle(requestFor("lyricId=2"));
  assert.equal(calls, 130);
});
