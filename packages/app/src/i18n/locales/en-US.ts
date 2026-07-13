import type { LocaleShape } from './schema'
import type zhCN from './zh-CN'

const enUS = {
  plugin: {
    market: {
      actions: {
        cancel: 'Cancel',
        details: 'Details',
        install: 'Install',
        loadMore: 'Load next page',
        refresh: 'Refresh',
        retry: 'Retry',
        source: 'View source',
        update: 'Update',
      },
      authors: 'Authors: {authors}',
      compatibility: {
        compatible: 'Compatible',
        incompatible: 'Incompatible',
        unknown: 'Checked during install',
      },
      confirm: {
        installTitle: 'Install this plugin?',
        source: 'Install source: {source}',
        updateTitle: 'Update this plugin?',
      },
      details: {
        authors: 'Authors',
        installId: 'Install ID',
        manifest: 'Manifest',
        manifestFallback: 'Fallback check during install',
        manifestVerified: 'manifest.json verified',
        publishedAt: 'Published',
        release: 'Latest release',
        supportCore: 'Supported core versions',
      },
      empty: 'No plugins match the current filters',
      end: 'You have reached the end',
      errors: { manifest: 'Manifest unavailable', title: 'Could not load the marketplace' },
      filters: {
        all: 'All',
        available: 'Not installed',
        installed: 'Installed',
        label: 'Plugin marketplace filters',
        updates: 'Updates',
      },
      loadedCount: '{count} plugins loaded',
      messages: { installed: 'Plugin installed', updated: 'Plugin updated' },
      noDescription: 'No description is available for this plugin',
      searchPlaceholder: 'Search plugins, authors, or descriptions',
      security: {
        insecure: 'Warning: this source does not use HTTPS.',
        notice:
          'Third-party plugins execute code inside the app. Verify the source and install only plugins you trust. The installer still validates the real manifest.json and core-version compatibility.',
        title: 'Installation security',
      },
      stale: 'Showing cached data that may be out of date',
      states: { installed: 'Installed', updateAvailable: 'Update available' },
      title: 'Plugin marketplace',
      version: 'Version: {version}',
    },
    menu: {
      config: 'Settings',
      install: 'Install',
      manage: 'Manage',
      market: 'Marketplace',
      version: 'Version: {version}',
    },
    reload: { action: 'Reload all', success: 'Normal plugins reloaded' },
    startup: {
      actions: { safeStart: 'Safe start', start: 'Start' },
      errors: { partialFailure: 'Some plugins failed to load. Check the details.' },
      loading: 'Plugins are already loading',
      prebootLoading: 'Preboot plugins are still loading',
      remember: {
        content: 'Remember this plugin selection and load it automatically next time?',
        negative: 'Not now',
        positive: 'Remember',
        title: 'Remember plugin selection',
      },
    },
  },
} satisfies LocaleShape<typeof zhCN>

export default enUS