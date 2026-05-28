import { DcAwait } from '@delta-comic/ui'
import { Fragment, h } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import { Global } from '@/global'

import type { GlobalInjections } from '.'

function Inject<T extends keyof GlobalInjections>(props: {
  key: T
  args: ComponentProps<GlobalInjections[T]>
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Await: any = DcAwait
  return h(
    Fragment,
    null,
    Array.from(Global.envExtends.values())
      .filter(v => v.key === props.key)
      .map(c =>
        h(
          Await,
          {
            promise: async () => {
              try {
                return await c.condition(props.args)
              } catch (error) {
                console.warn(error)
                return false
              }
            },
            autoLoad: true,
          },
          {
            default: ({ result }: { result: Awaited<ReturnType<typeof c.condition>> }) =>
              result && h(c.component, props.args),
          },
        ),
      ),
  )
}

export default Inject