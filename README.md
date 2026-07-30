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

本项目推荐使用固定的本地副本运行 MCP 服务器。Codex 启动时直接执行本地
`server.mjs`，不会临时下载或解析 GitHub 包。

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

请保留该目录；Codex 配置会通过绝对路径直接启动其中的 `server.mjs`。

### 2. 配置 Codex

打开 Codex 的全局配置文件：

- Windows：`%USERPROFILE%\.codex\config.toml`
- macOS/Linux：`~/.codex/config.toml`

加入以下配置，并替换示例路径和 Exa API 密钥：

```toml
[mcp_servers.exa-search-full]
command = "node"
args = ["/absolute/path/to/exa-search-full-mcp/server.mjs"]
startup_timeout_sec = 30

[mcp_servers.exa-search-full.env]
EXA_API_KEY = "your_key"
```

必须使用绝对路径。Windows 建议使用正斜杠，避免 TOML 反斜杠转义：

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

首次克隆并执行 `npm ci` 后，MCP 的启动过程完全在本地完成，不需要访问
GitHub。调用 Exa Search API 时仍然需要网络连接。

### 更新

需要升级时，在本地仓库中显式执行：

```bash
git pull --ff-only
npm ci --omit=dev
npm test
npm audit --omit=dev
```

更新完成后重启 Codex。

### 为什么不使用 `npx` 远程启动

通过 GitHub 包地址运行 `npx` 时，npm 可能在每次启动时重新解析远程仓库，
部分环境还可能把 GitHub 地址转换为 SSH，从而受到网络、端口和认证状态影响。
固定本地安装具有以下优点：

- MCP 启动不依赖 GitHub 或 npm 网络状态
- 启动时间稳定，不容易触发客户端超时
- 依赖版本由 `package-lock.json` 固定
- 升级时机明确，可在更新前后运行测试和安全审计

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

Exa 面向编码代理的最新文档列出了六个正式分类，没有列出 `pdf` 和 `github`；但在
2026-05-25 的真实 API 测试中，这两个分类均返回 HTTP 200，因此本项目将其
作为已实测分类支持。

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
