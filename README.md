# exa-search-full-mcp

Full Exa Search API MCP server for Codex and other MCP clients.

It exposes direct access to:

- `POST /search` through `exa_search_full`
- `POST /contents` through `exa_contents_full`

The `exa_search_full` tool supports Exa search types including `deep-lite`, `deep`, and `deep-reasoning`, plus `outputSchema` for structured output and grounding.

By default, `exa_search_full` does not request result contents. This keeps simple URL searches cheaper and faster. Pass `contents`, or set `defaultHighlights: true`, when you need excerpts, text, summaries, freshness controls, or subpage crawling.

## Install locally

Run the MCP server from a fixed local checkout. This avoids downloading or
resolving the GitHub package every time Codex starts the server.

### Requirements

- Node.js 20 or newer
- npm
- Git

### 1. Clone and install

```bash
git clone https://github.com/RiceTerrace/exa-search-full-mcp.git
cd exa-search-full-mcp
npm ci --omit=dev
```

Keep this directory in place because Codex will launch `server.mjs` directly
from it.

### 2. Configure Codex

Open your global Codex configuration file:

- macOS/Linux: `~/.codex/config.toml`
- Windows: `%USERPROFILE%\.codex\config.toml`

Add the following configuration and replace the example path and API key:

```toml
[mcp_servers.exa-search-full]
command = "node"
args = ["/absolute/path/to/exa-search-full-mcp/server.mjs"]
startup_timeout_sec = 30

[mcp_servers.exa-search-full.env]
EXA_API_KEY = "your_key"
```

Always use an absolute path. On Windows, forward slashes avoid TOML escaping:

```toml
args = ["C:/Users/you/.codex/mcp/exa-search-full/server.mjs"]
```

If Codex cannot find `node` through `PATH`, set `command` to the absolute path
of the Node.js executable. If `EXA_API_KEY` is already inherited by the Codex
process, you can omit the `[mcp_servers.exa-search-full.env]` table.

### 3. Restart and verify

Restart Codex, then check the registration:

```bash
codex mcp list
```

After the initial clone and `npm ci`, MCP startup is fully local and does not
require GitHub access. Calls to the Exa API still require internet access.

### Update

Update the local checkout explicitly when you want a newer version:

```bash
git pull --ff-only
npm ci --omit=dev
```

Restart Codex after updating.

## Tools

### `exa_search_full`

Direct Exa `/search` access with:

- `type`
- `numResults`
- `category`: `company`, `people`, `research paper`, `news`, `personal site`, `financial report`, `pdf`, `github`
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

`text`, `highlights`, `summary`, `maxAgeHours`, `livecrawlTimeout`, `subpages`, `subpageTarget`, and `extras` are mapped into the nested `/search` `contents` object. `text.verbosity` accepts `compact`, `standard`, and `full`.

The latest coding-agent docs list six official categories and omit `pdf` and `github`, but live API tests on 2026-05-25 returned 200 for both. They are supported here as live-tested categories. `category: "company"` rejects date filters locally. `category: "people"` rejects date filters, text filters, and `excludeDomains`; `includeDomains` must use LinkedIn domains. `category: "github"` rejects `excludeDomains`.

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

`text.verbosity` accepts `compact`, `standard`, and `full`.
