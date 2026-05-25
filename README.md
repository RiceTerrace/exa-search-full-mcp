# exa-search-full-mcp

Full Exa Search API MCP server for Codex and other MCP clients.

It exposes direct access to:

- `POST /search` through `exa_search_full`
- `POST /contents` through `exa_contents_full`

The `exa_search_full` tool supports Exa search types including `deep-lite`, `deep`, and `deep-reasoning`, plus `outputSchema` for structured output and grounding.

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
- `category`
- domain filters
- date filters
- `contents`
- `outputSchema`
- raw request `body`

### `exa_contents_full`

Direct Exa `/contents` access for known URLs or result IDs with:

- `ids`
- `urls`
- `contents`
- `textMaxCharacters`
- `highlights`
- `summary`
- `maxAgeHours`
- raw request `body`
