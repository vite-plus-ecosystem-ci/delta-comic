import type { PluginConfig } from '@/plugin'
import { runOtherProgress } from '@/plugin/otherProgress'

import { PluginBooter, type PluginBooterSetMeta } from '../../../driver/extensionTypes'

class _TestPluginResource extends PluginBooter {
  public override name = '其他步骤'
  public override async call(cfg: PluginConfig, setMeta: PluginBooterSetMeta): Promise<any> {
    if (!cfg.otherProgress?.length) return

    await runOtherProgress(cfg.otherProgress, { setMeta })
  }
}
export default new _TestPluginResource()