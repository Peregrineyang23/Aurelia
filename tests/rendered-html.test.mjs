import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Aurelia knowledge atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Aurelia/);
  assert.match(html, /Pharos Knowledge Atlas/i);
  assert.match(html, /117 chunks/);
  assert.match(html, /Driving HMI Sources/);
});

test("keeps private knowledge payloads out of the public source", async () => {
  const [page, browser, worker, hosting] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/KnowledgeBrowser.tsx", root), "utf8"),
    readFile(new URL("worker/knowledge.ts", root), "utf8"),
    readFile(new URL(".openai/hosting.json", root), "utf8"),
  ]);
  const source = `${page}\n${browser}\n${worker}`;
  assert.doesNotMatch(source, /\/Users\/frankyang\/WorkBuddy/);
  assert.doesNotMatch(source, /华为 · 地平线 · Momenta · 小鹏 · 蔚来/);
  assert.match(worker, /AURELIA_IMPORT_SECRET/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});
