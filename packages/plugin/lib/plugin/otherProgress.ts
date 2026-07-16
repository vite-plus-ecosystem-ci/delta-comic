export interface Config {
  /** Run immediately with adjacent async steps; a trailing async group does not block loading. */
  async?: boolean
  call: (setDescription: (description: string) => void) => PromiseLike<any>
  name: string
}

export interface OtherProgressRunnerOptions {
  onBackgroundError?: (error: AggregateError) => void
  setMeta: (meta: { description: string; name: string }) => void
}

const runProgress = async (progress: Config, setMeta: OtherProgressRunnerOptions['setMeta']) => {
  setMeta({ name: progress.name, description: '' })
  await progress.call(description => setMeta({ name: progress.name, description }))
}

export const runOtherProgress = async (
  progresses: readonly Config[],
  {
    setMeta,
    onBackgroundError = error => console.error('[plugin otherProgress]', error),
  }: OtherProgressRunnerOptions,
) => {
  let parallelGroup: Promise<void>[] = []

  for (const progress of progresses) {
    if (progress.async) {
      parallelGroup.push(runProgress(progress, setMeta))
      continue
    }

    if (parallelGroup.length > 0) {
      await Promise.all(parallelGroup)
      parallelGroup = []
    }
    await runProgress(progress, setMeta)
  }

  if (parallelGroup.length === 0) return
  void Promise.allSettled(parallelGroup).then(results => {
    const errors = results.flatMap(result => (result.status === 'rejected' ? [result.reason] : []))
    if (errors.length > 0) onBackgroundError(new AggregateError(errors, '后台插件步骤执行失败'))
  })
}