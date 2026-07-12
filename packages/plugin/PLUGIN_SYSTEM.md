# Delta Comic 客户端插件运行时

客户端插件由 `PluginRuntime` 统一管理发现、依赖计划、预启动、激活、卸载和重新加载。加载器只负责把
归档转换成 `PluginConfigFactory`，booter 只负责一个明确的激活阶段，生命周期编排不再散落在 UI 中。

## 插件类型

- `normal`（默认）：开屏完成后由用户点击启动。进入应用后可在插件页执行“重新加载所有”，运行时会按
  依赖逆序调用 `onUnload`、移除注册项和样式，再按拓扑顺序重新加载。
- `preboot`：manifest 设置 `kind: 'preboot'`。运行时会在 Vue `createApp` 之前加载模块并调用
  `onPreboot`；Vue provider 挂载后再执行普通 booter。类型或启用状态的调整在下次重启生效。

```ts
export default definePlugin({
  name: 'example.plugin',
  onPreboot({ platform }) {
    const controller = new AbortController()
    // 这里不能使用 useDialog/useMessage 等 Vue injection API。
    return () => controller.abort()
  },
  async onBooted() {
    return { ready: true }
  },
  async onUnload() {
    // 释放插件自己创建、且未由运行时跟踪的资源。
  },
  async onUninstall() {
    // 删除账号令牌等插件私有的外部资源；随后运行时会移除文件与数据库记录。
  },
})
```

`onPreboot` 可以返回清理函数。运行时在卸载时依次调用 `onUnload`、该清理函数，并移除 Global、模型注册、
配置、依赖暴露和 `data-plugin` 样式。

普通插件启动失败时会立即回滚该插件的注册项；依赖它的后续插件会被标为失败而不会继续启动。删除插件统一
经过 `PluginRuntime.uninstall()`，依次执行卸载/卸载安装 hook、清理运行态、删除归档文件和数据库记录。

## 故障恢复

任一预启动插件在 prepare 或 activate 阶段失败时，运行时会：

1. 在 SQLite 中一次性停用本次所有预启动插件；
2. 写入只包含插件名、时间和错误文本的恢复记录；
3. 刷新页面；
4. 在下次启动展示错误警告，让用户进入插件管理页调整并决定是否重新启用。

这样不会因为同一个预启动插件形成刷新循环，也不会静默恢复到不明确的部分加载状态。

## 平台存储

- Tauri：插件文件保存在 app local data 目录，安装和 ZIP 解包继续使用 Rust command。
- Web：SQLite 在专用 Worker 的 WASM 引擎中运行；插件归档解包后写入 IndexedDB，无法使用 IndexedDB
  时仅在当前会话使用内存回退。更新通过单个 IndexedDB 事务原子替换，失败时保留旧版本。JS 与 CSS
  都由统一存储接口读取。

归档在安装时使用 Rust 编译的 BLAKE3 WASM 生成完整性指纹；WASM 不可用时回退到 Web Crypto SHA-256。
Web 插件构建强制把动态 import 合并到单个 JavaScript 文件并内联二进制资源，CSS 中仍存在的相对资源会在
加载时转换为受生命周期管理的对象 URL。

浏览器不会模拟不安全的本地绝对路径访问；`local:` 安装器只在 Tauri 注册。URL、GitHub、文件选择和
ZIP/Userscript 安装在两端保持相同的上层接口。
