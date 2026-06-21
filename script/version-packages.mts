import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  getChangesetCommit,
  getReleasePlanVersion,
  getRepositoryUrl,
  publicPackageNames,
  readCurrentReleaseVersion,
  readReleasePlan,
  rootDir,
  run,
  type ReleasePlan,
} from './release-utils.mts'
import { setVersion } from './set-version.mts'

const releaseTypeOrder = ['patch', 'minor', 'major'] as const
type GroupedReleaseType = (typeof releaseTypeOrder)[number]

function highestReleaseType(types: GroupedReleaseType[]) {
  return types.sort((a, b) => releaseTypeOrder.indexOf(b) - releaseTypeOrder.indexOf(a))[0]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatSummary(summary: string, commit: string | undefined, repositoryUrl: string) {
  const [firstLine = '', ...restLines] = summary.trim().split('\n')
  const commitLink = commit ? ` ([${commit.slice(0, 7)}](${repositoryUrl}/commit/${commit}))` : ''
  const rest = restLines.map(line => `  ${line.trimEnd()}`).join('\n')
  return [`* ${firstLine.trimEnd()}${commitLink}`, rest].filter(Boolean).join('\n')
}

async function buildRootChangelogEntry(releasePlan: ReleasePlan, version: string) {
  const repositoryUrl = await getRepositoryUrl()
  const releases = releasePlan.releases.filter(release => publicPackageNames.includes(release.name))
  const oldVersion = releases[0]?.oldVersion
  const date = new Date().toISOString().slice(0, 10)
  const compare = oldVersion
    ? `[${version}](${repositoryUrl}/compare/${oldVersion}...${version})`
    : version
  const groups: Record<GroupedReleaseType, string[]> = { major: [], minor: [], patch: [] }

  for (const changeset of releasePlan.changesets) {
    const releaseTypes = changeset.releases
      .filter(release => publicPackageNames.includes(release.name))
      .map(release => release.type)
      .filter(
        (type): type is GroupedReleaseType =>
          type === 'major' || type === 'minor' || type === 'patch',
      )

    const type = highestReleaseType(releaseTypes)
    if (!type) continue

    const commit = await getChangesetCommit(changeset.id)
    groups[type].push(formatSummary(changeset.summary, commit, repositoryUrl))
  }

  const sections = [
    ['Major Changes', groups.major],
    ['Minor Changes', groups.minor],
    ['Patch Changes', groups.patch],
  ]
    .filter(([, lines]) => (lines as string[]).length > 0)
    .map(([title, lines]) => `### ${title}\n\n${(lines as string[]).join('\n')}`)

  return [`## ${compare} (${date})`, ...sections].join('\n\n')
}

function normalizeRootChangelog(raw: string) {
  let changelog = raw.trimStart()
  if (!changelog.startsWith('# delta-comic')) {
    changelog = `# delta-comic\n\n${changelog}`
  }
  return changelog.replace(/^# (?=\[?\d+\.\d+\.\d+)/gm, '## ')
}

async function updateRootChangelog(releasePlan: ReleasePlan | undefined, version: string) {
  if (!releasePlan || releasePlan.changesets.length === 0) return

  const changelogPath = join(rootDir, 'CHANGELOG.md')
  const raw = await readFile(changelogPath, { encoding: 'utf-8' })
  const changelog = normalizeRootChangelog(raw)
  const versionPattern = new RegExp(`^##\\s+(?:\\[)?${escapeRegExp(version)}(?:\\]|\\s|$)`, 'm')
  if (versionPattern.test(changelog)) {
    await writeFile(changelogPath, changelog.endsWith('\n') ? changelog : `${changelog}\n`, {
      encoding: 'utf-8',
    })
    return
  }

  const [title = '# delta-comic', ...rest] = changelog.split('\n')
  const entry = await buildRootChangelogEntry(releasePlan, version)
  const body = rest.join('\n').replace(/^\n+/, '')
  const next = `${title}\n\n${entry}\n\n${body}`.trimEnd()
  await writeFile(changelogPath, `${next}\n`, { encoding: 'utf-8' })
}

const releasePlan = await readReleasePlan()
await run('vp', ['exec', 'changeset', 'version'])

if (releasePlan.changesets.length === 0 || releasePlan.releases.length === 0) {
  process.exit(0)
}

const version = getReleasePlanVersion(releasePlan) ?? (await readCurrentReleaseVersion())
await setVersion(version)
await updateRootChangelog(releasePlan, version)