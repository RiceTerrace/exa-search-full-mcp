# exa-search-full-mcp

面向 Codex 和其他 MCP 客户端的完整 Exa Search API MCP 服务器。

本项目直接提供：

- 通过 `exa_search_full` 调用 Exa `POST /search`
- 通过 `exa_contents_full` 调用 Exa `POST /contents`

`exa_search_full` 支持 Exa 的 `deep-lite`、`deep`、`deep-reasoning`
等搜索类型，并支持使用 `outputSchema` 返回带溯源信息的结构化结果。

默认情况下，`exa_search_full` 不会请求搜索结果正文，以降低简单链接搜索的
延迟和费用。需要摘录、全文、摘要、新鲜度控制或子页面抓取时，请传入
`contents`，或设置 `defaultHighlights: true`。

## 本地安装（推荐）

本项目推荐使用固定的本地副本运行 MCP 服务器。

### 环境要求

- Node.js 20 或更高版本
- npm
- Git

### 1. 克隆并安装依赖

```bash
git clone https://github.com/RiceTerrace/exa-search-full-mcp.git
cd exa-search-full-mcp
npm ci --omit=dev
npm test
```

### 2. 配置 Codex

打开 Codex 的全局配置文件：

- Windows：`%USERPROFILE%\.codex\config.toml`
- macOS/Linux：`~/.codex/config.toml`

```toml
[mcp_servers.exa-search-full]
command = "node"
args = ["/absolute/path/to/exa-search-full-mcp/server.mjs"]
startup_timeout_sec = 30

[mcp_servers.exa-search-full.env]
EXA_API_KEY = "your_key"
```

Windows 建议使用正斜杠，避免 TOML 反斜杠转义：

```toml
args = ["C:/Users/you/.codex/mcp/exa-search-full/server.mjs"]
```

如果 Codex 无法通过 `PATH` 找到 Node.js，请把 `command` 改为 Node.js
可执行文件的绝对路径。例如：

```toml
command = "C:/Program Files/nodejs/node.exe"
```

如果不希望把密钥直接写入 `config.toml`，可以先在操作系统中设置
`EXA_API_KEY`，然后在服务器配置中使用：

```toml
env_vars = ["EXA_API_KEY"]
```

使用 `env_vars` 时不需要 `[mcp_servers.exa-search-full.env]` 配置表。

### 3. 重启并验证

重启 Codex，然后检查 MCP 注册状态：

```bash
codex mcp list
```

也可以在 Codex 终端界面中执行 `/mcp` 查看已启用的服务器。

### 更新

需要升级时，在本地仓库中显式执行：

```bash
git pull --ff-only
npm ci --omit=dev
npm test
npm audit --omit=dev
```

更新完成后重启 Codex。

## 工具

### `exa_search_full`

直接访问 Exa `/search`，支持：

- `type`
- `numResults`
- `category`：`company`、`people`、`research paper`、`news`、
  `personal site`、`financial report`、`pdf`、`github`
- 域名过滤条件
- 日期过滤条件
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
- 原始请求体 `body`

`text`、`highlights`、`summary`、`maxAgeHours`、`livecrawlTimeout`、
`subpages`、`subpageTarget` 和 `extras` 会映射到 `/search` 请求中的
`contents` 对象。`text.verbosity` 支持 `compact`、`standard` 和 `full`。

分类限制：

- `category: "company"` 不支持日期过滤条件
- `category: "people"` 不支持日期过滤、文本过滤和 `excludeDomains`；
  `includeDomains` 只能使用 LinkedIn 域名
- `category: "github"` 不支持 `excludeDomains`

### `exa_contents_full`

用于已经知道 URL 或 Exa 结果 ID 的场景，直接访问 Exa `/contents`，支持：

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
- 原始请求体 `body`

`contents` 是顶层 `/contents` 选项的便捷别名。与 `/search` 不同，
`/contents` 会把 `text`、`highlights`、`summary`、新鲜度控制、子页面控制
和 `extras` 保持在请求顶层。

`text.verbosity` 支持 `compact`、`standard` 和 `full`。

## 开发与验证

```bash
npm test
npm audit --omit=dev
```

本服务器使用 MCP 的 stdio 传输。`stdout` 只能输出 MCP JSON-RPC 消息；
调试或运行日志必须写入 `stderr`，否则会破坏协议通信。

## 相关官方文档

- [OpenAI：在 Codex 中配置 MCP](https://developers.openai.com/codex/mcp)
- [OpenAI：Codex 配置参考](https://developers.openai.com/codex/config-reference)
- [MCP 官方 stdio 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP TypeScript SDK：通过 stdio 提供服务](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio.html)
