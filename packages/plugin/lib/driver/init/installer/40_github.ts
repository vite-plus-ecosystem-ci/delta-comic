import type { PluginArchiveDB } from '@delta-comic/db'
import { Octokit } from '@octokit/rest'
import { isEmpty } from 'es-toolkit/compat'
import ky from 'ky'

import { useConfig } from '@/config'

import { PluginInstaller, type PluginInstallerDescription } from '../utils'

export class _PluginInstallByNormalUrl extends PluginInstaller {
  public override description: PluginInstallerDescription = {
    title: '通过Github安装插件',
    description: '输入形如: "gh:owner/repo"的内容',
  }
  public override name = 'github'
  private async fetchReleaseAsset(
    input: string,
  ): Promise<Awaited<ReturnType<Octokit['rest']['repos']['getLatestRelease']>>['data']['assets']> {
    const config = useConfig().$loadApp().data.value
    const octokit = new Octokit({ auth: isEmpty(config) ? undefined : config.githubToken })

    const [owner, repo] = input.replace(/^gh:/, '').split('/')
    const { data: release } = await octokit.rest.repos.listReleases({ owner, repo, pre_page: 20 })

    const assets = config.receivePerReleaseUpdate
      ? release.at(0)?.assets
      : release.find(v => !v.prerelease)?.assets

    if (!assets) throw new Error('Not found release.')
    return assets
  }
  private async installer(input: string): Promise<File> {
    const assets = await this.fetchReleaseAsset(input)
    const asset = assets.find(asset => asset.name == 'plugin.zip')
    if (!asset) throw new Error('未找到插件')

    const data = await ky
      .get(asset.browser_download_url, { retry: 2, timeout: 1000 * 60 * 5 })
      .blob()

    return new File([data], asset.name)
  }
  public override async download(input: string): Promise<File> {
    const file = await this.installer(input)
    return file
  }
  public override async update(pluginMeta: PluginArchiveDB.Archive): Promise<File> {
    const file = await this.installer(pluginMeta.installInput)
    return file
  }
  public override async fetchPluginMetaFile(input: string): Promise<File | string> {
    const assets = await this.fetchReleaseAsset(input)
    const asset = assets.find(asset => asset.name == 'manifest.json')
    if (!asset) throw new Error('未找到元数据文件')

    const data = await ky
      .get(asset.browser_download_url, { retry: 2, timeout: 1000 * 60 * 5 })
      .blob()

    return new File([data], 'manifest.json')
  }
  public override isMatched(input: string): boolean {
    return input.startsWith('gh:') && input.split('/').length === 2
  }
}

export default new _PluginInstallByNormalUrl()