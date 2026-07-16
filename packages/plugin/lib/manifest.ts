import type { PluginArchiveDB } from '@delta-comic/db'
import semver from 'semver'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requiredRecord = (value: unknown, path: string) => {
  if (!isRecord(value)) throw new PluginManifestError(`${path} must be an object`)
  return value
}

const requiredString = (value: unknown, path: string) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new PluginManifestError(`${path} must be a non-empty string`)
  }
  return value
}

const optionalPath = (value: unknown, path: string) => {
  const text = requiredString(value, path)
  const normalized = text.replaceAll('\\', '/')
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new PluginManifestError(`${path} must be a safe relative path`)
  }
  return text
}

export class PluginManifestError extends Error {
  public constructor(message: string) {
    super(`Invalid Delta Comic manifest: ${message}`)
    this.name = 'PluginManifestError'
  }
}

/**
 * Validates the exact manifest format emitted by the `deltaComic` Vite plugin.
 * The returned value is safe to use as the persisted plugin metadata shape.
 */
export const parsePluginManifest = (value: unknown): PluginArchiveDB.Meta => {
  const manifest = requiredRecord(value, 'manifest')
  const name = requiredRecord(manifest.name, 'manifest.name')
  const version = requiredRecord(manifest.version, 'manifest.version')
  const id = requiredString(name.id, 'manifest.name.id')
  if (id === '.' || id === '..' || /[\\/]/.test(id)) {
    throw new PluginManifestError('manifest.name.id contains an unsafe path segment')
  }

  const requireValue = manifest.require
  if (!Array.isArray(requireValue)) {
    throw new PluginManifestError('manifest.require must be an array')
  }
  const require = requireValue.map((dependency, index) => {
    const record = requiredRecord(dependency, `manifest.require[${index}]`)
    const download = record.download
    if (download !== undefined && typeof download !== 'string') {
      throw new PluginManifestError(`manifest.require[${index}].download must be a string`)
    }
    return {
      id: requiredString(record.id, `manifest.require[${index}].id`),
      ...(download === undefined ? {} : { download }),
    }
  })

  const result: PluginArchiveDB.Meta = {
    author: requiredString(manifest.author, 'manifest.author'),
    description: requiredString(manifest.description, 'manifest.description'),
    name: { display: requiredString(name.display, 'manifest.name.display'), id },
    require,
    version: {
      plugin: requiredString(version.plugin, 'manifest.version.plugin'),
      supportCore: requiredString(version.supportCore, 'manifest.version.supportCore'),
    },
  }

  if (manifest.entry !== undefined) {
    const entry = requiredRecord(manifest.entry, 'manifest.entry')
    result.entry = {
      jsPath: optionalPath(entry.jsPath, 'manifest.entry.jsPath'),
      ...(entry.cssPath === undefined
        ? {}
        : { cssPath: optionalPath(entry.cssPath, 'manifest.entry.cssPath') }),
    }
  }

  if (manifest.kind !== undefined) {
    if (manifest.kind !== 'normal' && manifest.kind !== 'preboot') {
      throw new PluginManifestError('manifest.kind must be "normal" or "preboot"')
    }
    result.kind = manifest.kind
  }

  if (manifest.integrity !== undefined) {
    const integrity = requiredRecord(manifest.integrity, 'manifest.integrity')
    if (integrity.algorithm !== 'blake3' && integrity.algorithm !== 'sha256') {
      throw new PluginManifestError('manifest.integrity.algorithm is unsupported')
    }
    result.integrity = {
      algorithm: integrity.algorithm,
      digest: requiredString(integrity.digest, 'manifest.integrity.digest'),
    }
  }

  return result
}

export const isPluginManifestCompatible = (manifest: PluginArchiveDB.Meta, coreVersion: string) =>
  semver.satisfies(coreVersion, manifest.version.supportCore)