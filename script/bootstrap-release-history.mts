import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

import { assertVersion, rootDir } from './set-version.mts'

const execFileAsync = promisify(execFile)

export type GitRunner = (
  args: string[],
  options?: { allowFailure?: boolean },
) => Promise<{ status: number; stdout: string }>

async function runGit(
  args: string[],
  options: { allowFailure?: boolean } = {},
): Promise<{ status: number; stdout: string }> {
  try {
    const result = await execFileAsync('git', args, { cwd: rootDir, encoding: 'utf-8' })
    return { status: 0, stdout: result.stdout }
  } catch (error) {
    const status = typeof error === 'object' && error && 'code' in error ? Number(error.code) : 1
    if (options.allowFailure) return { status, stdout: '' }
    throw error
  }
}

export class ReleaseHistoryBootstrap {
  private readonly configPath: string
  private readonly git: GitRunner

  constructor(git: GitRunner = runGit, configPath = 'release.config.mjs') {
    this.git = git
    this.configPath = configPath
  }

  async ensureBaseline(version: string) {
    assertVersion(version)
    const existingTag = await this.git(
      ['rev-parse', '--verify', '--quiet', `refs/tags/${version}`],
      { allowFailure: true },
    )
    if (existingTag.status === 0) return false

    const migration = await this.git([
      'log',
      '--diff-filter=A',
      '--format=%H',
      '-n',
      '1',
      '--',
      this.configPath,
    ])
    const migrationCommit = migration.stdout.trim()
    if (!migrationCommit) {
      throw new Error(`Unable to locate the commit that added ${this.configPath}`)
    }

    await this.git(['tag', '--no-sign', version, `${migrationCommit}^`])
    return true
  }
}

export async function readCurrentVersion() {
  const pkg = JSON.parse(await readFile(join(rootDir, 'package.json'), { encoding: 'utf-8' })) as {
    version: string
  }
  return pkg.version
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isCli) {
  const version = await readCurrentVersion()
  const created = await new ReleaseHistoryBootstrap().ensureBaseline(version)
  console.log(
    created ? `Created local release baseline ${version}` : `Release baseline ${version} exists`,
  )
}