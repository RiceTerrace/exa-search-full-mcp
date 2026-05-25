#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const EXA_API_BASE = process.env.EXA_API_BASE || "https://api.exa.ai";
const configuredTimeoutMs = Number(process.env.EXA_TIMEOUT_MS);
const DEFAULT_TIMEOUT_MS =
  Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
    ? configuredTimeoutMs
    : 60000;
const SEARCH_TYPES = [
  "auto",
  "fast",
  "instant",
  "deep-lite",
  "deep",
  "deep-reasoning"
];

function definedEntries(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}

function truncate(value, maxChars = 1200) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}...`;
}

function jsonText(value, pretty = false) {
  return typeof value === "string"
    ? value
    : JSON.stringify(value, null, pretty ? 2 : 0);
}

function apiKey() {
  const key = process.env.EXA_API_KEY;
  if (!key) {
    throw new Error("EXA_API_KEY is not set");
  }
  return key;
}

async function exaPost(path, body, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref?.();

  let response;
  try {
    response = await fetch(`${EXA_API_BASE}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey()
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Exa API request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const raw = await response.text();
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = raw;
  }

  if (!response.ok) {
    throw new Error(`Exa API ${response.status}: ${truncate(parsed)}`);
  }

  return parsed;
}

export function buildSearchBody(args) {
  if (args.body !== undefined) {
    return args.body;
  }

  if (!args.query) {
    throw new Error("query is required unless body is provided");
  }

  const hasContentControl =
    args.maxAgeHours !== undefined || args.livecrawlTimeout !== undefined;
  const contents = args.contents
    ? { ...args.contents }
    : args.defaultHighlights === true
      ? { highlights: true }
      : hasContentControl
        ? {}
      : undefined;

  if (contents && args.maxAgeHours !== undefined) {
    contents.maxAgeHours = args.maxAgeHours;
  }
  if (contents && args.livecrawlTimeout !== undefined) {
    contents.livecrawlTimeout = args.livecrawlTimeout;
  }

  return definedEntries({
    query: args.query,
    type: args.type || "auto",
    numResults: args.numResults,
    category: args.category,
    includeDomains: args.includeDomains,
    excludeDomains: args.excludeDomains,
    startPublishedDate: args.startPublishedDate,
    endPublishedDate: args.endPublishedDate,
    startCrawlDate: args.startCrawlDate,
    endCrawlDate: args.endCrawlDate,
    includeText: args.includeText,
    excludeText: args.excludeText,
    userLocation: args.userLocation,
    moderation: args.moderation,
    additionalQueries: args.additionalQueries,
    systemPrompt: args.systemPrompt,
    compliance: args.compliance,
    stream: args.stream,
    contents,
    outputSchema: args.outputSchema
  });
}

export function buildContentsBody(args) {
  if (args.body !== undefined) {
    return args.body;
  }

  if ((!args.ids || args.ids.length === 0) && (!args.urls || args.urls.length === 0)) {
    throw new Error("ids or urls is required unless body is provided");
  }

  const locator =
    Array.isArray(args.urls) && args.urls.length > 0
      ? { urls: args.urls }
      : { ids: args.ids };
  const contentOptions = args.contents
    ? { ...args.contents }
    : definedEntries({
        text:
          args.text !== undefined
            ? args.text
            : args.textMaxCharacters
              ? { maxCharacters: args.textMaxCharacters }
              : undefined,
        highlights: args.highlights,
        summary: args.summary
      });

  const options = definedEntries({
    maxAgeHours: args.maxAgeHours,
    livecrawlTimeout: args.livecrawlTimeout,
    subpages: args.subpages,
    subpageTarget: args.subpageTarget,
    extras: args.extras
  });

  return definedEntries({
    ...locator,
    ...contentOptions,
    ...options
  });
}

const looseObject = z.record(z.string(), z.unknown());

const server = new McpServer({
  name: "exa-search-full",
  version: "1.0.0"
});

server.registerTool(
  "exa_search_full",
  {
    title: "Exa Search Full",
    description:
      "Direct Exa /search access for the full Search API surface, including deep-lite, deep, deep-reasoning, outputSchema structured outputs, contents, filters, and raw request body pass-through.",
    inputSchema: {
      body: looseObject
        .optional()
        .describe(
          "Raw Exa /search request body. If provided, all other fields are ignored."
        ),
      query: z.string().optional().describe("Natural language search query."),
      type: z
        .enum(SEARCH_TYPES)
        .optional()
        .describe(
          "Search type. Use deep/deep-reasoning for multi-step research and synthesis."
        ),
      numResults: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of search results to return."),
      category: z
        .string()
        .optional()
        .describe(
          "Optional Exa category, such as company, people, news, github, pdf, research paper, personal site, or financial report."
        ),
      includeDomains: z.array(z.string()).optional(),
      excludeDomains: z.array(z.string()).optional(),
      startPublishedDate: z
        .string()
        .optional()
        .describe("Only include pages published after this date, YYYY-MM-DD."),
      endPublishedDate: z
        .string()
        .optional()
        .describe("Only include pages published before this date, YYYY-MM-DD."),
      startCrawlDate: z
        .string()
        .optional()
        .describe("Only include pages crawled after this date, YYYY-MM-DD."),
      endCrawlDate: z
        .string()
        .optional()
        .describe("Only include pages crawled before this date, YYYY-MM-DD."),
      includeText: z.array(z.string()).optional(),
      excludeText: z.array(z.string()).optional(),
      userLocation: z
        .string()
        .optional()
        .describe("ISO country code for geo-targeting, such as US or GB."),
      moderation: z.boolean().optional(),
      additionalQueries: z
        .array(z.string())
        .optional()
        .describe("Additional query variations for coverage."),
      systemPrompt: z
        .string()
        .optional()
        .describe(
          "Instructions for synthesized output and deep-search planning."
        ),
      compliance: z
        .string()
        .optional()
        .describe("Enterprise compliance mode, for example hipaa."),
      stream: z
        .boolean()
        .optional()
        .describe(
          "If true, Exa returns server-sent event text instead of a single JSON body."
        ),
      contents: looseObject
        .optional()
        .describe(
          "Exa contents object, for example {\"highlights\": true}, {\"text\":{\"maxCharacters\":10000}}, or {\"summary\":{\"query\":\"...\"}}."
        ),
      outputSchema: looseObject
        .optional()
        .describe(
          "JSON schema for structured output. Exa returns output.content and output.grounding."
        ),
      maxAgeHours: z
        .number()
        .optional()
        .describe("Mapped to contents.maxAgeHours. Use 0 to force livecrawl."),
      livecrawlTimeout: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Mapped to contents.livecrawlTimeout in milliseconds."),
      defaultHighlights: z
        .boolean()
        .optional()
        .describe("Set true to add contents.highlights when contents is absent."),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Request timeout in milliseconds."),
      pretty: z
        .boolean()
        .optional()
        .describe("Pretty-print returned JSON. Defaults to compact output.")
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => {
    const requestBody = buildSearchBody(args);
    const result = await exaPost("/search", requestBody, args.timeoutMs);
    return {
      content: [{ type: "text", text: jsonText(result, args.pretty) }]
    };
  }
);

server.registerTool(
  "exa_contents_full",
  {
    title: "Exa Contents Full",
    description:
      "Direct Exa /contents access for URLs or Exa result IDs. Use when URLs are already known and you need clean text, highlights, summaries, or a raw /contents request body.",
    inputSchema: {
      body: looseObject
        .optional()
        .describe(
          "Raw Exa /contents request body. If provided, all other fields are ignored."
        ),
      ids: z.array(z.string()).optional().describe("URLs or Exa result IDs."),
      urls: z.array(z.string()).optional().describe("Alias for ids."),
      contents: looseObject
        .optional()
        .describe("Alias object for top-level /contents options."),
      text: z.union([z.boolean(), looseObject]).optional(),
      textMaxCharacters: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Convenience for contents.text.maxCharacters."),
      highlights: z.union([z.boolean(), looseObject]).optional(),
      summary: z.union([z.boolean(), looseObject]).optional(),
      maxAgeHours: z
        .number()
        .optional()
        .describe("Content freshness control. Use 0 to force livecrawl."),
      livecrawlTimeout: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Livecrawl timeout in milliseconds."),
      subpages: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Number of subpages to crawl from each URL."),
      subpageTarget: z.union([z.string(), z.array(z.string())]).optional(),
      extras: looseObject.optional(),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Request timeout in milliseconds."),
      pretty: z
        .boolean()
        .optional()
        .describe("Pretty-print returned JSON. Defaults to compact output.")
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => {
    const requestBody = buildContentsBody(args);
    const result = await exaPost("/contents", requestBody, args.timeoutMs);
    return {
      content: [{ type: "text", text: jsonText(result, args.pretty) }]
    };
  }
);

export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
