"use strict";
process.env.NODE_ENV = "test";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const createApp = require("../src/app");

let server, base;

before(async () => {
  server = createApp({ rateMax: 30 }).listen(0);
  await new Promise(r => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

const j = (method, path, body, raw) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: raw ?? (body ? JSON.stringify(body) : undefined)
  });

test("GET /health -> 200", async () => {
  const r = await j("GET", "/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("GET /guides -> 200 list, filter by topic", async () => {
  const all = await (await j("GET", "/guides")).json();
  assert.equal(all.count, 9);
  const css = await (await j("GET", "/guides?topic=css")).json();
  assert.equal(css.count, 3);
  assert.ok(css.data.every(g => g.topic === "css"));
});

test("GET /guides?topic=bogus -> 400", async () => {
  assert.equal((await j("GET", "/guides?topic=bogus")).status, 400);
});

test("GET /guides/:id -> 200, 404, 400", async () => {
  assert.equal((await j("GET", "/guides/1")).status, 200);
  assert.equal((await j("GET", "/guides/999")).status, 404);
  assert.equal((await j("GET", "/guides/abc")).status, 400);
});

test("POST /guides valid -> 201 + Location", async () => {
  const r = await j("POST", "/guides", { title: "REST Basics", text: "Resources are nouns, methods are verbs.", topic: "js" });
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.ok(body.data.id >= 10);
  assert.equal(r.headers.get("location"), `/api/guides/${body.data.id}`);
});

test("POST /guides invalid -> 400 with field details", async () => {
  const r = await j("POST", "/guides", { title: "x", text: 5, topic: "nope" });
  assert.equal(r.status, 400);
  const { error } = await r.json();
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.deepEqual(error.details.map(d => d.field).sort(), ["text", "title", "topic"]);
});

test("POST malformed JSON -> 400 (not 500)", async () => {
  const r = await j("POST", "/guides", null, "{bad json");
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error.code, "BAD_REQUEST");
});

test("PUT /guides/:id updates; 404 when missing; 400 when empty", async () => {
  const ok = await j("PUT", "/guides/2", { title: "Accessible Forms v2" });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.title, "Accessible Forms v2");
  assert.equal((await j("PUT", "/guides/999", { title: "Whatever" })).status, 404);
  assert.equal((await j("PUT", "/guides/2", {})).status, 400);
});

test("DELETE /guides/:id -> 204 then 404", async () => {
  assert.equal((await j("DELETE", "/guides/9")).status, 204);
  assert.equal((await j("DELETE", "/guides/9")).status, 404);
});

test("POST /messages valid -> 201, invalid -> 400", async () => {
  const ok = await j("POST", "/messages", { name: "Riya", email: "riya@example.com", message: "Hello, great guides!" });
  assert.equal(ok.status, 201);
  const bad = await j("POST", "/messages", { name: "R", email: "nope", message: "short" });
  assert.equal(bad.status, 400);
});

test("Unknown route -> JSON 404", async () => {
  const r = await j("GET", "/nothing-here");
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error.code, "NOT_FOUND");
});

test("Rate limit -> 429 with Retry-After", async () => {
  let last;
  for (let i = 0; i < 40; i++) last = await j("GET", "/health");
  assert.equal(last.status, 429);
  assert.ok(last.headers.get("retry-after"));
});
