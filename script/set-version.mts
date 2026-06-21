import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const jsonVersionPaths = [
  '../package.json',
  '../packages/app/package.json',
  '../packages/app/src-tauri/tauri.conf.json',
  '../packages/db/package.json',
  '../packages/model/package.json',
  '../packages/plugin/package.json',
  '../packages/ui/package.json',
  '../packages/utils/package.json',
]
const cargoTomlPaths = ['../packages/app/src-tauri/Cargo.toml', '../Cargo.toml']
const cargoLockPackageNames = [
  'delta-comic',
  'tauri-plugin-db',
  'tauri-plugin-plugin',
  'tauri-plugin-utils',
]

function replaceVersion(raw: string, pattern: RegExp, version: string, label: string) {
  if (!pattern.test(raw)) throw new Error(`Unable to find version field in ${label}`)
  pattern.lastIndex = 0
  return raw.replace(pattern, `$1${version}$2`)
}

async function setJsonVersion(path: string, version: string) {
  const raw = await readFile(path, { encoding: 'utf-8' })
  const pkg = JSON.parse(raw) as { version: string }
  pkg.version = version
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}${raw.endsWith('\n') ? '\n' : ''}`, {
    encoding: 'utf-8',
  })
}

async function setCargoTomlVersion(
  path: string,
  version: string,
  section: 'package' | 'workspace.package',
) {
  const raw = await readFile(path, { encoding: 'utf-8' })
  const pattern =
    section === 'workspace.package'
      ? /(\[workspace\.package\][\s\S]*?^version = ")[^"]+(")/m
      : /(\[package\][\s\S]*?^version = ")[^"]+(")/m
  await writeFile(path, replaceVersion(raw, pattern, version, section), { encoding: 'utf-8' })
}

async function setCargoLockVersion(version: string) {
  const path = join(import.meta.dirname, '../Cargo.lock')
  const raw = await readFile(path, { encoding: 'utf-8' })
  let next = raw

  for (const name of cargoLockPackageNames) {
    next = replaceVersion(
      next,
      new RegExp(`(\\[\\[package\\]\\]\\nname = "${name}"\\nversion = ")[^"]+(")`, 'g'),
      version,
      `Cargo.lock package ${name}`,
    )
  }

  await writeFile(path, next, { encoding: 'utf-8' })
}

export async function setVersion(version: string) {
  for (const p of jsonVersionPaths) {
    const path = join(import.meta.dirname, p)
    await setJsonVersion(path, version)
  }

  for (const [index, p] of cargoTomlPaths.entries()) {
    const path = join(import.meta.dirname, p)
    await setCargoTomlVersion(path, version, index === 0 ? 'package' : 'workspace.package')
  }

  await setCargoLockVersion(version)
}

const version = process.argv[2]
if (version) await setVersion(version)