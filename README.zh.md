# CrowdComputed OpenAPI 文档站

[English](README.md) · [中文](README.zh.md)

CrowdComputed API 的开源文档站点，基于 [Next.js](https://nextjs.org/)、[Fumadocs](https://fumadocs.dev/) 与 [fumadocs-openapi](https://fumadocs.dev/docs/openapi) 构建。站点同时提供人工编写的说明（MDX）和由 OpenAPI 规范自动生成的 API 参考，并支持**多语言**（英文与中文）。文档内可通过界面或 URL（`/en/` 或 `/zh/`）切换语言。

## 功能概览

- **双轨内容**：静态 MDX 文档（欢迎页、定价、指南）+ 由 OpenAPI 驱动的动态 API 参考
- **多语言**：默认英文（`en`），支持中文（`zh`）。文档内可切换语言（如 `/en/`、`/zh/`）
- **交互式 API 调试**：对 Workflow / Global API 发起请求并查看响应
- **代码示例**：支持 cURL、Python、JavaScript、Go、Java、C# 等多种请求示例
- **搜索与导航**：侧边栏、目录与可分享链接

## 技术栈

- **框架**：Next.js 16
- **文档**：Fumadocs（MDX + OpenAPI）
- **包管理**：pnpm
- **样式**：Tailwind CSS

## 快速开始

### 直接使用

使用 [Docker Hub 官方镜像](https://hub.docker.com/r/crowdcomputed/cc-openapi-docs) 直接拉取并启动，无需本地构建。容器暴露 **端口 3000**。镜像支持 **linux/amd64** 与 **linux/arm64**（Apple Silicon）。

```bash
docker pull crowdcomputed/cc-openapi-docs:stable
docker run -p 3000:3000 crowdcomputed/cc-openapi-docs:stable
```

然后访问 [http://localhost:3000](http://localhost:3000)。若出现 `no matching manifest for linux/arm64`（旧版镜像尚未多架构），可用 amd64 模拟运行：`docker run --platform linux/amd64 -p 3000:3000 crowdcomputed/cc-openapi-docs:stable`。

若需指定 API 地址：

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-api.example.com crowdcomputed/cc-openapi-docs:stable
```

### 二次开发

如需修改文档或从源码运行：

**环境要求：** [Node.js](https://nodejs.org/) 20+、[pnpm](https://pnpm.io/) 9+

1. **克隆与安装**

```bash
git clone https://github.com/CrowdComputed/cc-openapi-docs.git
cd cc-openapi-docs
pnpm install
```

2. **环境变量**

在项目根目录创建 `.env.local`（或使用已有 `.env`），配置用于拉取 OpenAPI 的 API 地址：

```bash
# 必填：CrowdComputed API 基础地址（用于拉取 OpenAPI 与调试）
NEXT_PUBLIC_API_URL=https://api.crowdcomputed.com
```

若使用其他环境（如预发），请修改为对应地址。

3. **本地运行**

```bash
pnpm dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。应用会重定向到默认语言（如 `/en`）。在页面中切换语言或直接访问 `/zh` 可查看中文文档。

4. **（可选）生成静态 API 文档**

若需从 OpenAPI 预生成 API 文档文件（例如写入 `content/docs/(api)`）：

```bash
pnpm run build:docs
```

该脚本会从 `NEXT_PUBLIC_API_URL` 拉取 OpenAPI 文档，并按语言生成 MDX。站点也可在运行时动态加载 OpenAPI。

## 常用脚本

| 命令                | 说明                     |
| ------------------- | ------------------------ |
| `pnpm dev`          | 启动开发服务器           |
| `pnpm build`        | 生产环境构建             |
| `pnpm start`        | 启动生产环境服务         |
| `pnpm run build:docs` | 从 OpenAPI 生成 API 文档 |
| `pnpm run types:check` | MDX 类型生成 + TS 检查 |
| `pnpm lint`         | Biome 检查               |
| `pnpm format`       | Biome 格式化             |

## 项目结构

```
├── content/docs/          # MDX 内容与 meta
│   ├── (api)/             # 由 OpenAPI 生成的 API 参考
│   ├── *.mdx / *.zh.mdx   # 静态文档（英/中）
│   └── meta.json          # 侧栏与导航配置
├── src/
│   ├── app/[locale]/      # 按语言的路由（en, zh）
│   ├── lib/               # source、i18n、openapi 配置
│   ├── openapi/           # OpenAPI 解析、UI、调试与代码生成
│   └── components/        # 通用组件
├── scripts/
│   └── generate-docs.ts   # OpenAPI → MDX 生成脚本
└── docker/                # Docker 与 compose 配置
```

## 语言切换说明

- **默认语言**：英文（`en`）。根路径 `/` 会重定向到 `/en`。
- **支持的语言**：`en`、`zh`。
- **URL 规则**：文档路径为 `/{locale}/...`，例如 `/en`、`/en/docs/welcome`、`/zh`、`/zh/docs/welcome`。
- **内容**：静态页面对应 `*.mdx`（英文）与 `*.zh.mdx`（中文）；API 参考按语言从 OpenAPI 生成（后端可按语言返回不同描述）。

如需增加语言，可在 `src/lib/i18n.ts` 中配置新 locale，并添加对应 MDX（如 `*.ja.mdx`）。

## Docker

- **开发**：使用 `docker/development/` 下的 Dockerfile 与 docker-compose。
- **生产**：使用 `docker/production/`（Next.js standalone 输出 + PM2）。

先完成应用构建，再使用生产镜像运行。

## 开源协议

本项目为开源项目，详见 [LICENSE](LICENSE)。

## 相关链接

- [CrowdComputed](https://crowdcomputed.com)
- [Docker Hub: crowdcomputed/cc-openapi-docs](https://hub.docker.com/r/crowdcomputed/cc-openapi-docs)
- [Fumadocs](https://fumadocs.dev/)
- [OpenAPI](https://www.openapis.org/)
