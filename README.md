# exa-search-full-mcp

Full Exa Search API MCP server for Codex and other MCP clients.

It exposes direct access to:

- `POST /search` through `exa_search_full`
- `POST /contents` through `exa_contents_full`

The `exa_search_full` tool supports Exa search types including `deep-lite`, `deep`, and `deep-reasoning`, plus `outputSchema` for structured output and grounding.

By default, `exa_search_full` does not request result contents. This keeps simple URL searches cheaper and faster. Pass `contents`, or set `defaultHighlights: true`, when you need excerpts, text, summaries, freshness controls, or subpage crawling.

## Install

Set your Exa API key:

```bash
export EXA_API_KEY="your_key"
```

Add it to Codex:

```bash
codex mcp add exa-search-full -- npx -y github:RiceTerrace/exa-search-full-mcp
```

## Tools

### `exa_search_full`

Direct Exa `/search` access with:

- `type`
- `numResults`
- `category`: `company`, `people`, `research paper`, `news`, `personal site`, `financial report`
- domain filters
- date filters
- `includeText`
- `excludeText`
- `additionalQueries`
- `systemPrompt`
- `contents`
- `text`
- `textMaxCharacters`
- `highlights`
- `summary`
- `maxAgeHours`
- `livecrawlTimeout`
- `subpages`
- `subpageTarget`
- `extras`
- `outputSchema`
- `compliance`
- `stream`
- `timeoutMs`
- raw request `body`

`text`, `highlights`, `summary`, `maxAgeHours`, `livecrawlTimeout`, `subpages`, `subpageTarget`, and `extras` are mapped into the nested `/search` `contents` object. `additionalQueries` requires `type` to be `deep-lite`, `deep`, or `deep-reasoning`.

For `category: "company"` and `category: "people"`, date filters, text filters, and `excludeDomains` are rejected locally because the Search API does not support them. For `category: "people"`, `includeDomains` only accepts LinkedIn domains.

### `exa_contents_full`

Direct Exa `/contents` access for known URLs or result IDs with:

- `ids`
- `urls`
- `contents`
- `textMaxCharacters`
- `highlights`
- `summary`
- `maxAgeHours`
- `livecrawlTimeout`
- `subpages`
- `subpageTarget`
- `extras`
- `compliance`
- `timeoutMs`
- raw request `body`

`contents` is accepted as a convenience alias for top-level `/contents` options. Unlike `/search`, `/contents` keeps `text`, `highlights`, `summary`, freshness controls, subpage controls, and extras at the request top level.
