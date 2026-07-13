const zhCN = {
  plugin: {
    market: {
      actions: {
        cancel: '取消',
        details: '详情',
        install: '安装',
        loadMore: '加载下一页',
        refresh: '刷新',
        retry: '重试',
        source: '查看来源',
        update: '更新',
      },
      authors: '作者：{authors}',
      compatibility: { compatible: '兼容', incompatible: '不兼容', unknown: '待安装器校验' },
      confirm: {
        installTitle: '确认安装此插件？',
        source: '安装来源：{source}',
        updateTitle: '确认更新此插件？',
      },
      details: {
        authors: '作者',
        installId: '安装标识',
        manifest: '版本清单',
        manifestFallback: '安装时回退校验',
        manifestVerified: '已校验 manifest.json',
        publishedAt: '发布时间',
        release: '最新版本',
        supportCore: '支持的核心版本',
      },
      empty: '没有符合条件的插件',
      end: '已经到底了',
      errors: { manifest: '版本清单不可用', title: '插件市场加载失败' },
      filters: {
        all: '全部',
        available: '未安装',
        installed: '已安装',
        label: '插件市场筛选',
        updates: '可更新',
      },
      loadedCount: '已加载 {count} 个插件',
      messages: { installed: '插件安装完成', updated: '插件更新完成' },
      noDescription: '此插件暂未提供描述',
      searchPlaceholder: '搜索插件、作者或描述',
      security: {
        insecure: '警告：该来源未使用 HTTPS。',
        notice:
          '第三方插件会在应用内执行代码。请核对来源并仅安装你信任的插件；安装器仍会校验真实 manifest.json 与核心版本兼容性。',
        title: '安装安全提示',
      },
      stale: '正在显示缓存数据，内容可能已过期',
      states: { installed: '已安装', updateAvailable: '有新版本' },
      title: '插件市场',
      version: '版本：{version}',
    },
    menu: {
      config: '配置',
      install: '安装',
      manage: '管理',
      market: '市场',
      version: '版本: {version}',
    },
    reload: { action: '重新加载所有', success: '普通插件已重新加载' },
    startup: {
      actions: { safeStart: '安全启动', start: '启动' },
      errors: { partialFailure: '部分插件加载失败，请检查详情' },
      loading: '正在启动中',
      prebootLoading: '预启动插件仍在加载',
      remember: {
        content: '是否记住本次插件选择，并在下次启动时自动加载？',
        negative: '暂不',
        positive: '记住',
        title: '记忆插件选择',
      },
    },
  },
}

export default zhCN