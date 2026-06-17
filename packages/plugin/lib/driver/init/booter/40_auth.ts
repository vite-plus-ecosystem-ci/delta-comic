import { createForm } from '@delta-comic/ui'
import {
  closeWebviewPage,
  getWebviewAuthData,
  openWebviewPage,
  storageEntriesToRecord,
} from '@delta-comic/utils'
import { Mutex } from 'es-toolkit'
import { NModal, useDialog } from 'naive-ui'
import { defineComponent, h, markRaw, ref } from 'vue'

import { usePluginStore } from '@/driver/store'
import { Global } from '@/global'
import type { Auth, PluginConfig } from '@/plugin'

import { PluginBooter, type PluginBooterSetMeta } from '../utils'

const authPopupMutex = new Mutex()
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class _PluginAuth extends PluginBooter {
  public override name = '登录'
  public override async call(cfg: PluginConfig, setMeta: PluginBooterSetMeta): Promise<any> {
    if (!cfg.auth) return
    const pluginStore = usePluginStore()
    let mutexAcquired = false
    try {
      const pluginName = pluginStore.$getI18nName(cfg.name)
      setMeta('判定鉴权状态中...')
      const isPass = await cfg.auth.passSelect()
      const waitMethod = Promise.withResolvers<'logIn' | 'signUp'>()
      console.log(`[plugin auth] ${pluginName}, isPass: ${isPass}`)
      await authPopupMutex.acquire()
      mutexAcquired = true
      setMeta('等待其他插件鉴权结束...')
      if (!isPass) {
        setMeta('选择鉴权方式')
        void useDialog().create({
          type: 'default',
          positiveText: '登录',
          negativeText: '注册',
          closable: false,
          maskClosable: false,
          content: '选择鉴权方式',
          title: pluginName,
          onNegativeClick() {
            waitMethod.resolve('signUp')
          },
          onPositiveClick() {
            waitMethod.resolve('logIn')
          },
        })
      } else {
        setMeta('跳过鉴权方式选择')
        waitMethod.resolve(isPass)
      }
      const method = await waitMethod.promise
      setMeta('鉴权中...')
      const by: Auth.Method = {
        async form(form) {
          const formInstance = createForm(form)
          Global.globalNodes.push(
            markRaw(
              defineComponent(() => {
                const show = ref(true)
                void formInstance.data.then(() => (show.value = false))
                return () =>
                  h(
                    NModal,
                    { show: show.value, position: 'center', preset: 'dialog', title: pluginName },
                    formInstance.comp,
                  )
              }),
            ),
          )
          const data = await formInstance.data
          return data
        },
        async website<T>(
          url: string,
          injectCode: Auth.InjectCode,
        ): Promise<Auth.CallbackResult<T>> {
          const page = await openWebviewPage({
            allFrames: true,
            css: injectCode.css,
            js: injectCode.js,
            title: pluginName,
            url,
          })
          try {
            for (;;) {
              const data = await getWebviewAuthData(page.label)
              const callback = data.storage.callback
              if (callback) {
                return {
                  callbackValue: callback.value as T,
                  cookie: callback.cookie || data.storage.cookie,
                  href: callback.href || data.storage.href,
                  localStorage: storageEntriesToRecord(
                    callback.localStorage.length
                      ? callback.localStorage
                      : data.storage.localStorage,
                  ),
                  sessionStorage: storageEntriesToRecord(
                    callback.sessionStorage.length
                      ? callback.sessionStorage
                      : data.storage.sessionStorage,
                  ),
                  title: callback.title || data.storage.title,
                }
              }
              await wait(300)
            }
          } finally {
            void closeWebviewPage(page.label).catch((error: unknown) => {
              console.warn('[plugin auth] failed to close auth page', page.label, error)
            })
          }
        },
      }
      if (method == 'logIn') {
        await cfg.auth.logIn(by)
      } else if (method == 'signUp') {
        await cfg.auth.signUp(by)
      }
      authPopupMutex.release()
      mutexAcquired = false
      setMeta('鉴权成功')
    } catch (error: any) {
      if (mutexAcquired) authPopupMutex.release()
      setMeta(`登录失败: ${error}`)
      throw error
    }
  }
}
export default new _PluginAuth()