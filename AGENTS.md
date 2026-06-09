<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->

# delta-comic 项目索引（AI 工作指南）

## 项目概览

**delta-comic** (v2.3.1) 是基于 **Tauri 2.x** 的跨平台漫画阅读应用，支持 Android 和桌面端。采用 **pnpm monorepo** 架构，以 **AGPL-3.0** 协议开源。

- **前端**：Vue 3 + TypeScript + Vite + NaiveUI + Vant + Pinia + Vue Router
- **后端**：Rust (Tauri 2.x) + SQLite + Kysely ORM
- **数据库**：本地 SQLite，通过 `tauri-plugin-sql` 操作，Kysely 做类型安全查询
- **插件系统**：分级可扩展架构，通过 Composition API 注入页面和功能
- **线上仓库**：https://github.com/delta-comic/delta-comic.git

---

## Workspace 包依赖关系（从底层到顶层）

```
packages/model         ← 纯类型定义，无 workspace 依赖
  ↑
packages/utils         ← 通用工具，无 workspace 依赖
  ↑
packages/db            ← 依赖 model
packages/plugin        ← 依赖 model
  ↑
packages/ui            ← 依赖 model
  ↑
packages/app           ← 依赖所有包 + src-tauri (Rust)
```

---

## 各包详细说明

### 1. `packages/model` — 数据模型层（@delta-comic/model）

**职责**：定义整个项目共享的 TypeScript 类型、接口、枚举。最底层包，被几乎所有其他包依赖。

| 路径 | 说明 |
|------|------|
| `packages/model/lib/index.ts` | 总入口，聚合导出 model/ 和 struct/ 下的所有类型 |
| `packages/model/lib/model/` | 业务数据模型（Comic、Chapter、Author、Favourite 等类型定义） |
| `packages/model/lib/struct/` | 通用数据结构（`SourcedValue`、`SourcedKeyMap` 等） |

---

### 2. `packages/utils` — 通用工具层（@delta-comic/utils）

**职责**：提供共享工具函数，集成 Sentry（错误监控）、Aptabase（分析）、mitt（事件总线）。

| 文件 | 说明 |
|------|------|
| `packages/utils/lib/index.ts` | 总入口 |
| `packages/utils/lib/env.ts` | 环境检测（`isTauri`、`isMobile`、`isDesktop`、`getPlatform`） |
| `packages/utils/lib/ipc.ts` | Tauri IPC 通信封装 |
| `packages/utils/lib/net.ts` | 网络请求相关工具 |
| `packages/utils/lib/var.ts` | 全局变量/常量 |
| `packages/utils/lib/analyze.ts` | Aptabase 分析统计 |
| `packages/utils/lib/fullscreen.ts` | 全屏控制 |
| `packages/utils/lib/temp.ts` | 临时文件管理 |

---

### 3. `packages/db` — 数据库抽象层（@delta-comic/db）

**职责**：基于 Kysely + Tauri SQL Plugin 封装本地 SQLite 操作。使用 `kysely-dialect-tauri` 适配 Tauri，`kysely-plugin-serialize` 做序列化。包含 7 张业务表。

| 文件 | 说明 |
|------|------|
| `packages/db/lib/index.ts` | 总入口，初始化 Kysely 实例并注册迁移 |
| `packages/db/lib/favourite.ts` | 收藏夹 CRUD（增删改查卡片+项，支持排序/移动） |
| `packages/db/lib/history.ts` | 阅读历史记录 upsert/查询 |
| `packages/db/lib/itemStore.ts` | 通用物品 KV 存储（SourcedValue 键值对） |
| `packages/db/lib/plugin.ts` | 插件归档管理 |
| `packages/db/lib/recentView.ts` | 最近浏览记录 |
| `packages/db/lib/subscribe.ts` | 订阅管理（作者/EP 订阅） |
| `packages/db/lib/utils.ts` | 工具函数（`withTransaction`、`countDb`） |
| `packages/db/lib/nativeStore/` | 基于 localStorage 的持久化存储 |
| `packages/db/lib/migrations/` | 数据库迁移脚本 |
| | `1_initial.ts` — 初始建表 |
| | `2_fix-display_name.ts` — 修复 display_name 字段 |
| | `3_fix_fvi_foreign_key.ts` — 修复外键约束 |

**7 张表**：`itemStore`、`favouriteCard`、`favouriteItem`、`history`、`recentView`、`subscribe`、`plugin`

---

### 4. `packages/plugin` — 插件系统（@delta-comic/plugin）

**职责**：核心插件框架，提供插件驱动、配置管理、依赖解析。内置 comic 插件。

| 路径 | 说明 |
|------|------|
| `packages/plugin/lib/index.ts` | 总入口 |
| `packages/plugin/lib/config.ts` | 插件配置表单生成与类型定义 |
| `packages/plugin/lib/depends.ts` | 插件依赖解析 |
| `packages/plugin/lib/global.ts` | 全局插件状态管理（`Global.plugins`、`Global.config` 等） |
| `packages/plugin/lib/driver/` | 插件驱动（各数据源适配器） |
| `packages/plugin/lib/plugin/` | 内置 comic 插件实现 |
| `packages/plugin/vite/index.ts` | Vite 构建插件 |

**核心概念**：每个插件是一个提供页面/功能注入点的 Vue composable，包括 `searchPages`、`userActionPages`、`categories` 等。

---

### 5. `packages/ui` — UI 组件库（@delta-comic/ui）

**职责**：共享 UI 组件，基于 NaiveUI 和 Vant。

| 路径 | 说明 |
|------|------|
| `packages/ui/lib/index.ts` | 总入口，全局注册所有 UI 组件 |
| `packages/ui/lib/index.css` | 全局样式 |
| `packages/ui/lib/components/` | 通用 UI 组件 |
| `packages/ui/lib/message/` | 消息提示组件 |
| `packages/ui/lib/utils/` | UI 相关工具函数 |
| `packages/ui/vite/index.ts` | Vite 构建插件 |

---

### 6. `packages/app` — 主应用（@delta-comic/app）

**职责**：Tauri 桌面应用，包含 Vue 前端 + Rust 后端（`src-tauri/`）。

#### 前端核心文件

| 文件 | 说明 |
|------|------|
| `packages/app/src/main.tsx` | 应用入口，挂载 Vue 应用 + 初始化 NaiveUI/Vant/Pinia/Router |
| `packages/app/src/App.vue` | 根组件，包含 `<RouterView>` + 更新检测 + 插件加载 |
| `packages/app/src/AppSetup.vue` | 应用初始化设置界面 |
| `packages/app/src/router.ts` | Vue Router 配置（基于 `unplugin-vue-router` 文件系统路由） |
| `packages/app/src/logger.ts` | 前端日志（Sentry 集成） |
| `packages/app/src/symbol.ts` | 全局 injection key 定义 |
| `packages/app/src/icons.tsx` | SVG 图标组件集合 |
| `packages/app/src/stores/app.ts` | Pinia store — 应用全局状态 |
| `packages/app/src/stores/content.ts` | Pinia store — 内容相关状态 |

#### 前端路由全景图

```
/                          → 重定向到 /main/home/random
/cate                      → 分类浏览页面
/setting                   → 设置页面
/main                      → 主布局框架（底部 TabBar：首页/关注/Fork/插件/我的）
  ├── /main/home           →   首页框架（搜索栏 + 顶部 Tab）
  │   ├── /main/home/random   →   推荐内容流
  │   ├── /main/home/hot      →   热门内容
  │   └── ...                 →   各插件的动态 Tab
  ├── /main/subscribe      →   关注页（作者列表 + 追更状态）
  ├── /main/fork           →   Fork 页面
  ├── /main/plugin         →   插件管理（管理/安装/市场/配置 子路由）
  ├── /main/search         →   搜索页
  └── /main/user           →   我的页面（用户卡片/收藏/历史/缓存/设置入口）
```

#### 前端组件目录

| 目录 | 说明 |
|------|------|
| `packages/app/src/components/` | 通用组件 |
| `packages/app/src/components/home/` | 首页相关组件 |
| `packages/app/src/components/search/` | 搜索相关组件 |
| `packages/app/src/components/subscribe/` | 关注/订阅相关组件 |
| `packages/app/src/components/plugin/` | 插件管理相关组件 |
| `packages/app/src/components/user/` | 用户相关组件 |

#### Rust 后端 (`packages/app/src-tauri/`)

| 文件 | 说明 |
|------|------|
| `src-tauri/src/main.rs` | 应用入口，调用 `delta_comic::run()` |
| `src-tauri/src/lib.rs` | 核心组装：注册所有 Tauri 插件、处理 App Ready/Exit 事件 |
| `src-tauri/src/db.rs` | SQLite 插件初始化（`sqlite:app.db`） |
| `src-tauri/src/fs_scheme.rs` | 自定义 `local://` URI scheme 协议处理器 |
| `src-tauri/src/logger.rs` | Rust 端日志系统初始化 |
| `src-tauri/src/sentry.rs` | Sentry 崩溃报告初始化 |
| `src-tauri/tauri.conf.json` | Tauri 核心配置（窗口、权限、bundle） |
| `src-tauri/capabilities/default.json` | 能力声明（权限白名单） |
| `src-tauri/build.rs` | Cargo 构建脚本 |

**Tauri 插件列表**（按初始化顺序）：`tauri-plugin-fs` > Sentry > Logger > 自定义 `local://` scheme > `tauri-plugin-shell` > `tauri-plugin-m3` > `tauri-plugin-better-cors-fetch` > `tauri-plugin-clipboard-manager` > `tauri-plugin-persisted-scope` > `tauri-plugin-aptabase` > SQLite

---

## 根目录工程配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 根 package.json，定义 monorepo 脚本 |
| `pnpm-workspace.yaml` | pnpm workspace 配置 |
| `tsconfig.base.json` | 共享 TypeScript 基础配置 |
| `tsconfig.node.json` | Node 端 TypeScript 配置 |
| `vite.config.ts` | 根 Vite 配置 |
| `Cargo.toml` | Rust workspace 配置 |
| `rustfmt.toml` | Rust 格式化配置 |
| `.commitlintrc.json` | 提交信息规范 |
| `.releaserc.mjs` | semantic-release 发布配置 |
| `cspell.json` | 拼写检查配置（自定义词库 `words.txt`） |
| `pnpm-lock.yaml` | pnpm 锁定文件 |
| `script/set-version.mts` | 版本设置脚本 |
| `script/update-version.mts` | 版本更新脚本 |

---

## 开发命令速查

| 命令 | 作用 |
|------|------|
| `vp install` | 安装依赖（等同于 `pnpm install`） |
| `vp dev` | 启动 Vite 开发服务器 |
| `vp build` | 生产构建 |
| `vp check` | 运行 lint + fmt + typecheck |
| `vp lint` | 运行 Oxlint |
| `vp fmt` | 运行 Oxfmt 格式化 |
| `vp test` | 运行 Vitest 测试 |
| `vp run tauri dev` | 启动 Tauri 桌面应用开发 |
| `vp run tauri build` | 构建 Tauri 桌面应用 |
| `vp run typecheck` | TypeScript 类型检查 |
| `vp run release` | 执行 semantic-release 发布流程 |
| `vp dlx` | 执行一次性二进制（替代 npx/dlx） |
| `vp add <pkg>` | 添加依赖 |
| `vp remove <pkg>` | 卸载依赖 |

注意：`vp dev` 始终运行 Vite+ 内置的 dev server。要运行自定义脚本（如 `dev` 脚本），使用 `vp run dev`。

---

## 修改功能速查表

| 需求 | 去这里 |
|------|--------|
| 添加/修改数据类型 | `packages/model/lib/model/` |
| 修改数据库表结构 | `packages/db/lib/migrations/` 新增迁移 + 更新 `index.ts` DB 接口 |
| 修改数据库 CRUD 操作 | `packages/db/lib/` 对应文件 |
| 添加/修改插件 | `packages/plugin/lib/plugin/` + `packages/plugin/lib/driver/` |
| 修改全局 UI 组件 | `packages/ui/lib/components/` |
| 修改页面 UI | `packages/app/src/pages/` 对应路由文件 |
| 修改页面逻辑组件 | `packages/app/src/components/` 对应目录 |
| 修改路由 | `packages/app/src/router.ts` |
| 修改全局状态 | `packages/app/src/stores/` |
| 修改 Rust 后端逻辑 | `packages/app/src-tauri/src/` 对应文件 |
| 修改 Tauri 权限 | `packages/app/src-tauri/tauri.conf.json` + `capabilities/` |
| 修改工具函数 | `packages/utils/lib/` |
| 修改样式 | `packages/ui/lib/index.css` 或各组件内的 `<style>` |
| 修改图标 | `packages/app/src/icons.tsx` |
| 修改构建配置 | 各包的 `vite.config.mts` |
