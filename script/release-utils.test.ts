import { describe, expect, it } from 'vite-plus/test'

import { estimateReleaseVersion, type ReleasePlan } from './release-utils.mts'

function releasePlan(releases: ReleasePlan['releases']): ReleasePlan {
  return {
    changesets: [
      {
        id: 'test-release',
        releases: releases.map(({ name, type }) => ({ name, type })),
        summary: 'test release',
      },
    ],
    releases,
  }
}

describe('estimateReleaseVersion', () => {
  it('falls back to the current version when there is no release plan', () => {
    expect(estimateReleaseVersion(undefined, '2.3.0')).toBe('2.3.0')
  })

  it('falls back to the current version when no package is being released', () => {
    expect(
      estimateReleaseVersion(
        releasePlan([
          { name: '@delta-comic/model', oldVersion: '2.3.0', newVersion: '2.3.0', type: 'none' },
          { name: '@delta-comic/ui', oldVersion: '2.3.0', newVersion: '2.4.0', type: 'none' },
        ]),
        '2.3.0',
      ),
    ).toBe('2.3.0')
  })

  it('uses the highest release version from the release plan', () => {
    expect(
      estimateReleaseVersion(
        releasePlan([
          { name: '@delta-comic/model', oldVersion: '2.3.0', newVersion: '2.3.1', type: 'patch' },
          { name: '@delta-comic/ui', oldVersion: '2.3.0', newVersion: '2.4.0', type: 'minor' },
          { name: '@delta-comic/db', oldVersion: '2.3.0', newVersion: '2.10.0', type: 'major' },
        ]),
        '2.3.0',
      ),
    ).toBe('2.10.0')
  })

  it('prefers stable versions over prereleases with the same core version', () => {
    expect(
      estimateReleaseVersion(
        releasePlan([
          {
            name: '@delta-comic/model',
            oldVersion: '2.3.0',
            newVersion: '3.0.0-beta.2',
            type: 'major',
          },
          { name: '@delta-comic/ui', oldVersion: '2.3.0', newVersion: '3.0.0', type: 'major' },
        ]),
        '2.3.0',
      ),
    ).toBe('3.0.0')
  })
})