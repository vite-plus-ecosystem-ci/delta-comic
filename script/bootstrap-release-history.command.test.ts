import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const mocks = vi.hoisted(() => ({ execFile: vi.fn() }))

vi.mock('node:child_process', () => ({ execFile: mocks.execFile }))

type ExecCallback = (error: unknown, result?: { stdout: string }) => void

function respondWith(error: unknown, stdout = '') {
  mocks.execFile.mockImplementationOnce((...args: unknown[]) => {
    const callback = args.at(-1) as ExecCallback
    callback(error, error ? undefined : { stdout })
  })
}

beforeEach(() => {
  mocks.execFile.mockReset()
})

describe('ReleaseHistoryBootstrap default git runner', () => {
  it('checks the repository tag without changing an existing baseline', async () => {
    respondWith(null, 'tag-sha\n')
    const { ReleaseHistoryBootstrap } = await import('./bootstrap-release-history.mts')
    const { rootDir } = await import('./set-version.mts')

    await expect(new ReleaseHistoryBootstrap().ensureBaseline('2.3.0')).resolves.toBe(false)

    expect(mocks.execFile).toHaveBeenCalledExactlyOnceWith(
      'git',
      ['rev-parse', '--verify', '--quiet', 'refs/tags/2.3.0'],
      { cwd: rootDir, encoding: 'utf-8' },
      expect.any(Function),
    )
  })

  it('uses the failed git status only for the optional tag lookup', async () => {
    respondWith(Object.assign(new Error('missing tag'), { code: '128' }))
    respondWith(null, '  migration-sha  \n')
    respondWith(null)
    const { ReleaseHistoryBootstrap } = await import('./bootstrap-release-history.mts')

    await expect(new ReleaseHistoryBootstrap().ensureBaseline('2.3.0')).resolves.toBe(true)

    expect(mocks.execFile).toHaveBeenNthCalledWith(
      3,
      'git',
      ['tag', '--no-sign', '2.3.0', 'migration-sha^'],
      expect.objectContaining({ encoding: 'utf-8' }),
      expect.any(Function),
    )
  })

  it('normalizes non-object lookup failures and still creates the baseline', async () => {
    respondWith('git unavailable')
    respondWith(null, 'migration-sha\n')
    respondWith(null)
    const { ReleaseHistoryBootstrap } = await import('./bootstrap-release-history.mts')

    await expect(new ReleaseHistoryBootstrap().ensureBaseline('2.3.0')).resolves.toBe(true)
    expect(mocks.execFile).toHaveBeenCalledTimes(3)
  })

  it('propagates required git command failures without attempting a tag', async () => {
    const logError = new Error('history unavailable')
    respondWith(Object.assign(new Error('missing tag'), { code: 128 }))
    respondWith(logError)
    const { ReleaseHistoryBootstrap } = await import('./bootstrap-release-history.mts')

    await expect(new ReleaseHistoryBootstrap().ensureBaseline('2.3.0')).rejects.toBe(logError)
    expect(mocks.execFile).toHaveBeenCalledTimes(2)
  })
})