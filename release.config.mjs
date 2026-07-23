import pkg from './package.json' with { type: 'json' }
import { versionAssetPaths } from './script/set-version.mts'

/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: ['main'],
  repositoryUrl: pkg.repository.url,
  tagFormat: '${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'angular' }],
    ['@semantic-release/release-notes-generator', { preset: 'angular' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    './script/semantic-release-plugin.mts',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', ...versionAssetPaths],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    ['@semantic-release/github', { assets: ['dist/release/**/*'] }],
  ],
}