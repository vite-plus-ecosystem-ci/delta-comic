import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReleaseHistoryBootstrap, type GitRunner } from './bootstrap-release-history.mts'
import { createReleasePlugin, type CommandRunner } from './semantic-release-plugin.mts'
import {
  cargoLockPackageNames,
  cargoTomlVersionPaths,
  jsonVersionPaths,
  VersionSynchronizer,
} from './set-version.mts'

const fixtures: string[] = []

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map(path => rm(path, { force: true, recursive: true })))
})

async function createVersionFixture() {
  const cwd = await mkdtemp(join(tmpdir(), 'delta-comic-version-'))
  fixtures.push(cwd)

  for (const path of jsonVersionPaths) {
    const target = join(cwd, path)
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, '{\n  "name": "fixture",\n  "version": "1.0.0"\n}\n')
  }

  for (const [path, section] of cargoTomlVersionPaths) {
    const target = join(cwd, path)
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, `[${section}]\nname = "fixture"\nversion = "1.0.0"\n`)
  }

  await writeFile(
    join(cwd, 'Cargo.lock'),
    cargoLockPackageNames
      .map(name => `[[package]]\nname = "${name}"\nversion = "1.0.0"\n`)
      .join('\n'),
  )
  return cwd
}

describe('VersionSynchronizer', () => {
  it('keeps every JavaScript, Tauri and Rust manifest on one version', async () => {
    const cwd = await createVersionFixture()
    await new VersionSynchronizer(cwd).setVersion('3.1.0-beta.2')

    for (const path of jsonVersionPaths) {
      const pkg = JSON.parse(await readFile(join(cwd, path), { encoding: 'utf-8' })) as {
        version: string
      }
      expect(pkg.version).toBe('3.1.0-beta.2')
    }
    for (const [path] of cargoTomlVersionPaths) {
      expect(await readFile(join(cwd, path), { encoding: 'utf-8' })).toContain(
        'version = "3.1.0-beta.2"',
      )
    }
    const cargoLock = await readFile(join(cwd, 'Cargo.lock'), { encoding: 'utf-8' })
    expect(cargoLock.match(/version = "3\.1\.0-beta\.2"/g)).toHaveLength(
      cargoLockPackageNames.length,
    )
  })

  it('rejects malformed versions before editing files', async () => {
    const cwd = await createVersionFixture()
    await expect(new VersionSynchronizer(cwd).setVersion('next')).rejects.toThrow(
      'Invalid semantic version',
    )
  })
})

describe('ReleaseHistoryBootstrap', () => {
  it('creates the missing current-version tag at the migration parent', async () => {
    const calls: string[][] = []
    const git = vi.fn<GitRunner>(async (args, options) => {
      calls.push(args)
      if (options?.allowFailure) return { status: 1, stdout: '' }
      if (args[0] === 'log') return { status: 0, stdout: 'migration-sha\n' }
      return { status: 0, stdout: '' }
    })

    await expect(new ReleaseHistoryBootstrap(git).ensureBaseline('2.3.0')).resolves.toBe(true)
    expect(calls.at(-1)).toEqual(['tag', '--no-sign', '2.3.0', 'migration-sha^'])
  })

  it('does not replace an existing release tag', async () => {
    const git = vi.fn<GitRunner>(async () => ({ status: 0, stdout: 'tag-sha\n' }))
    await expect(new ReleaseHistoryBootstrap(git).ensureBaseline('2.3.0')).resolves.toBe(false)
    expect(git).toHaveBeenCalledOnce()
  })
})

describe('semantic-release monorepo plugin', () => {
  it('reports and prepares the version calculated by semantic-release', async () => {
    const synchronizeVersion = vi.fn<(version: string) => Promise<void>>().mockResolvedValue()
    const writeOutput = vi
      .fn<(path: string, contents: string) => Promise<void>>()
      .mockResolvedValue()
    const plugin = createReleasePlugin({ synchronizeVersion, writeOutput })
    const context = {
      env: { GITHUB_OUTPUT: '/tmp/output', NPM_TOKEN: 'secret' },
      nextRelease: { version: '3.0.0' },
    }

    await plugin.verifyConditions({}, context)
    await plugin.verifyRelease({}, context)
    await plugin.prepare({}, context)

    expect(writeOutput).toHaveBeenCalledWith('/tmp/output', 'has-release=true\nversion=3.0.0\n')
    expect(synchronizeVersion).toHaveBeenCalledWith('3.0.0')
  })

  it('builds libraries before recursively publishing the fixed workspace', async () => {
    const publishCommand = vi.fn<CommandRunner>().mockResolvedValue()
    const plugin = createReleasePlugin({ publishCommand })
    await plugin.publish()

    expect(publishCommand.mock.calls).toEqual([
      ['vp', ['run', 'lib-build']],
      ['vp', ['pm', 'publish', '-r', '--no-git-checks', '--provenance']],
    ])
  })
})