import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

type ReleaseType = 'major' | 'minor' | 'patch' | 'none'

export interface ReleasePlan {
  changesets: Array<{
    id: string
    releases: Array<{ name: string; type: ReleaseType }>
    summary: string
  }>
  releases: Array<{ name: string; newVersion: string; oldVersion: string; type: ReleaseType }>
}

export const rootDir = join(import.meta.dirname, '..')

export const publicPackageNames = [
  '@delta-comic/model',
  '@delta-comic/utils',
  '@delta-comic/db',
  '@delta-comic/ui',
  '@delta-comic/plugin',
]

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, { encoding: 'utf-8' })) as T
}

export async function run(
  command: string,
  args: string[],
  options: { allowFailure?: boolean; capture?: boolean } = {},
) {
  const { allowFailure = false, capture = false } = options

  return await new Promise<{ stdout: string; stderr: string; status: number }>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        cwd: rootDir,
        stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      })
      let stdout = ''
      let stderr = ''

      if (capture) {
        child.stdout?.on('data', data => {
          stdout += data.toString()
        })
        child.stderr?.on('data', data => {
          stderr += data.toString()
        })
      }

      child.on('error', reject)
      child.on('close', status => {
        const code = status ?? 1
        if (code === 0 || allowFailure) {
          resolve({ stdout, stderr, status: code })
          return
        }
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`))
      })
    },
  )
}

export async function readReleasePlan(options: { allowEmpty?: boolean } = {}) {
  const output = '.changeset/release-plan.json'
  const outputPath = join(rootDir, output)
  await rm(outputPath, { force: true })

  const result = await run('vp', ['exec', 'changeset', 'status', '--output', output], {
    allowFailure: true,
    capture: true,
  })

  if (!existsSync(outputPath)) {
    if (options.allowEmpty) return undefined
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error('Unable to calculate changesets release plan')
  }

  const releasePlan = await readJson<ReleasePlan>(outputPath)
  await rm(outputPath, { force: true })
  return releasePlan
}

function compareVersionParts(left: string, right: string) {
  const leftNumber = /^\d+$/.test(left) ? Number(left) : undefined
  const rightNumber = /^\d+$/.test(right) ? Number(right) : undefined

  if (leftNumber !== undefined && rightNumber !== undefined) return leftNumber - rightNumber
  if (leftNumber !== undefined) return -1
  if (rightNumber !== undefined) return 1
  return left.localeCompare(right)
}

function compareSemver(left: string, right: string) {
  const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/
  const leftMatch = semverPattern.exec(left)
  const rightMatch = semverPattern.exec(right)

  if (!leftMatch) throw new Error(`Invalid release version: ${left}`)
  if (!rightMatch) throw new Error(`Invalid release version: ${right}`)

  for (const index of [1, 2, 3]) {
    const diff = Number(leftMatch[index]) - Number(rightMatch[index])
    if (diff !== 0) return diff
  }

  const leftPrerelease = leftMatch[4]
  const rightPrerelease = rightMatch[4]
  if (!leftPrerelease && !rightPrerelease) return 0
  if (!leftPrerelease) return 1
  if (!rightPrerelease) return -1

  const leftParts = leftPrerelease.split('.')
  const rightParts = rightPrerelease.split('.')
  const length = Math.max(leftParts.length, rightParts.length)
  for (let index = 0; index < length; index++) {
    const leftPart = leftParts[index]
    const rightPart = rightParts[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1

    const diff = compareVersionParts(leftPart, rightPart)
    if (diff !== 0) return diff
  }

  return 0
}

function highestVersion(versions: string[]) {
  return versions.reduce<string | undefined>((highest, version) => {
    if (!highest) return version
    return compareSemver(version, highest) > 0 ? version : highest
  }, undefined)
}

export function getReleasePlanVersion(releasePlan?: ReleasePlan) {
  if (!releasePlan) return undefined

  return highestVersion(
    releasePlan.releases
      .filter(release => release.type !== 'none')
      .map(release => release.newVersion),
  )
}

export function estimateReleaseVersion(
  releasePlan: ReleasePlan | undefined,
  currentVersion: string,
) {
  return getReleasePlanVersion(releasePlan) ?? currentVersion
}

export async function readCurrentReleaseVersion() {
  const pkg = await readJson<{ version: string }>(join(rootDir, 'packages/model/package.json'))
  return pkg.version
}

export async function getChangesetCommit(id: string) {
  const result = await run(
    'git',
    ['log', '--diff-filter=A', '--format=%H', '-n', '1', '--', `.changeset/${id}.md`],
    { allowFailure: true, capture: true },
  )
  return result.stdout.trim() || undefined
}

export async function getRepositoryUrl() {
  const pkg = await readJson<{ repository?: { url?: string } | string }>(
    join(rootDir, 'package.json'),
  )
  const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  return (repository ?? 'https://github.com/delta-comic/delta-comic')
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
}