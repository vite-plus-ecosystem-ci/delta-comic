import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { rootDir } from './release-utils.mts'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const version = process.argv[2]
if (!version) {
  throw new Error('Usage: node ./script/release-notes.mts <version>')
}

const changelog = await readFile(join(rootDir, 'CHANGELOG.md'), { encoding: 'utf-8' })
const versionHeading = new RegExp(`^##\\s+(?:\\[)?${escapeRegExp(version)}(?:\\]|\\s|$)`)
const lines = changelog.split(/\r?\n/)
const start = lines.findIndex(line => versionHeading.test(line))

if (start === -1) {
  console.log(`Release ${version}`)
  process.exit(0)
}

const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line))
const notes = lines
  .slice(start + 1, end === -1 ? undefined : end)
  .join('\n')
  .trim()
console.log(notes || `Release ${version}`)