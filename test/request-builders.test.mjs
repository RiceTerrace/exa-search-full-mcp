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

test("buildSearchBody keeps explicit contents separate from default highlights", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "latest api docs",
      contents: { text: { maxCharacters: 1000 } },
      defaultHighlights: true
    }),
    {
      query: "latest api docs",
      type: "auto",
      contents: { text: { maxCharacters: 1000 } }
    }
  );
});

test("buildSearchBody maps content shortcuts into nested contents", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "exa content options",
      text: { maxCharacters: 700, verbosity: "standard" },
      highlights: { query: "parameters", maxCharacters: 250 },
      summary: { query: "summarize api shape" },
      subpages: 2,
      subpageTarget: ["docs", "reference"],
      extras: { links: 3 },
      maxAgeHours: -1
    }),
    {
      query: "exa content options",
      type: "auto",
      contents: {
        text: { maxCharacters: 700, verbosity: "standard" },
        highlights: { query: "parameters", maxCharacters: 250 },
        summary: { query: "summarize api shape" },
        subpages: 2,
        subpageTarget: ["docs", "reference"],
        extras: { links: 3 },
        maxAgeHours: -1
      }
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

test("buildSearchBody accepts live-tested undocumented categories", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "machine learning benchmark",
      category: "pdf"
    }),
    {
      query: "machine learning benchmark",
      type: "auto",
      category: "pdf"
    }
  );

  assert.deepEqual(
    buildSearchBody({
      query: "exa mcp server",
      category: "github",
      includeText: ["model context protocol"]
    }),
    {
      query: "exa mcp server",
      type: "auto",
      category: "github",
      includeText: ["model context protocol"]
    }
  );
});

test("buildSearchBody rejects unsupported company date filters", () => {
  assert.throws(
    () =>
      buildSearchBody({
        query: "ai companies",
        category: "company",
        startPublishedDate: "2025-01-01"
      }),
    /category "company" does not support startPublishedDate/
  );
});

test("buildSearchBody accepts live-tested company text and domain filters", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "ai companies",
      category: "company",
      excludeDomains: ["example.com"],
      includeText: ["artificial intelligence"],
      excludeText: ["crypto"]
    }),
    {
      query: "ai companies",
      type: "auto",
      category: "company",
      excludeDomains: ["example.com"],
      includeText: ["artificial intelligence"],
      excludeText: ["crypto"]
    }
  );
});

test("buildSearchBody rejects unsupported people domains", () => {
  assert.throws(
    () =>
      buildSearchBody({
        query: "ai researchers",
        category: "people",
        includeDomains: ["example.com"]
      }),
    /includeDomains only accepts LinkedIn domains/
  );
});

test("buildSearchBody accepts linkedin domains for people category", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "ai researchers",
      category: "people",
      includeDomains: ["https://www.linkedin.com/in"]
    }),
    {
      query: "ai researchers",
      type: "auto",
      category: "people",
      includeDomains: ["https://www.linkedin.com/in"]
    }
  );
});

test("buildSearchBody rejects unsupported people filters", () => {
  assert.throws(
    () =>
      buildSearchBody({
        query: "ai researchers",
        category: "people",
        includeText: ["machine learning"]
      }),
    /category "people" does not support includeText/
  );
});

test("buildSearchBody rejects unsupported github filters", () => {
  assert.throws(
    () =>
      buildSearchBody({
        query: "exa mcp server",
        category: "github",
        excludeDomains: ["example.com"]
      }),
    /category "github" does not support excludeDomains/
  );
});

test("buildSearchBody accepts additional queries for non-deep search types", () => {
  assert.deepEqual(
    buildSearchBody({
      query: "exa docs",
      additionalQueries: ["exa contents docs"]
    }),
    {
      query: "exa docs",
      type: "auto",
      additionalQueries: ["exa contents docs"]
    }
  );

  assert.deepEqual(
    buildSearchBody({
      query: "exa docs",
      type: "fast",
      additionalQueries: ["exa contents docs"]
    }),
    {
      query: "exa docs",
      type: "fast",
      additionalQueries: ["exa contents docs"]
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

test("buildContentsBody supports subpages extras and compliance", () => {
  assert.deepEqual(
    buildContentsBody({
      urls: ["https://example.com"],
      text: { maxCharacters: 1000, verbosity: "compact" },
      subpages: 3,
      subpageTarget: "docs",
      extras: { imageLinks: 2 },
      compliance: "hipaa"
    }),
    {
      urls: ["https://example.com"],
      text: { maxCharacters: 1000, verbosity: "compact" },
      subpages: 3,
      subpageTarget: "docs",
      extras: { imageLinks: 2 },
      compliance: "hipaa"
    }
  );
});

test("buildContentsBody supports standard text verbosity", () => {
  assert.deepEqual(
    buildContentsBody({
      urls: ["https://example.com"],
      text: { maxCharacters: 1000, verbosity: "standard" }
    }),
    {
      urls: ["https://example.com"],
      text: { maxCharacters: 1000, verbosity: "standard" }
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
