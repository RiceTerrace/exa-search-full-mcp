import test from "node:test";
import assert from "node:assert/strict";
import { buildContentsBody, buildSearchBody } from "../server.mjs";

test("buildSearchBody passes through raw bodies", () => {
  const body = { query: "raw", type: "deep", contents: { highlights: true } };
  assert.equal(buildSearchBody({ body }), body);
});

test("buildSearchBody passes through empty raw bodies", () => {
  const body = {};
  assert.equal(buildSearchBody({ body }), body);
});

test("buildSearchBody omits contents by default", () => {
  assert.deepEqual(buildSearchBody({ query: "exa docs" }), {
    query: "exa docs",
    type: "auto"
  });
});

test("buildSearchBody adds optional highlights and synthesis parameters", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "frontier model releases",
      type: "deep-reasoning",
      numResults: 3,
      defaultHighlights: true,
      systemPrompt: "Prefer official sources",
      outputSchema: { type: "object", properties: { names: { type: "array" } } }
    }),
    {
      query: "frontier model releases",
      type: "deep-reasoning",
      numResults: 3,
      systemPrompt: "Prefer official sources",
      contents: { highlights: true },
      outputSchema: { type: "object", properties: { names: { type: "array" } } }
    }
  );
});

test("buildSearchBody maps freshness controls into contents", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "fresh docs",
      maxAgeHours: 0,
      livecrawlTimeout: 12000
    }),
    {
      query: "fresh docs",
      type: "auto",
      contents: { maxAgeHours: 0, livecrawlTimeout: 12000 }
    }
  );
});

test("buildContentsBody uses top-level contents options", () => {
  assert.deepEqual(
    buildContentsBody({
      urls: ["https://example.com"],
      textMaxCharacters: 500,
      highlights: { query: "main point", maxCharacters: 200 },
      maxAgeHours: -1
    }),
    {
      urls: ["https://example.com"],
      text: { maxCharacters: 500 },
      highlights: { query: "main point", maxCharacters: 200 },
      maxAgeHours: -1
    }
  );
});

test("buildContentsBody passes through empty raw bodies", () => {
  const body = {};
  assert.equal(buildContentsBody({ body }), body);
});

test("buildContentsBody falls back to ids when urls is empty", () => {
  assert.deepEqual(
    buildContentsBody({
      ids: ["doc-id"],
      urls: [],
      text: true
    }),
    {
      ids: ["doc-id"],
      text: true
    }
  );
});

test("buildContentsBody keeps explicit contents alias top-level", () => {
  assert.deepEqual(
    buildContentsBody({
      ids: ["doc-id"],
      contents: { summary: { query: "facts" }, extras: { links: 2 } }
    }),
    {
      ids: ["doc-id"],
      summary: { query: "facts" },
      extras: { links: 2 }
    }
  );
});

test("buildContentsBody requires ids or urls", () => {
  assert.throws(() => buildContentsBody({ text: true }), /ids or urls/);
});
