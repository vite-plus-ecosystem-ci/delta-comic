import { spawn } from 'node:child_process'
import { appendFile } from 'node:fs/promises'

import { assertVersion, rootDir, setVersion } from './set-version.mts'

interface ReleaseContext {
  env: NodeJS.ProcessEnv
  nextRelease: { version: string }
}

export type CommandRunner = (command: string, args: string[]) => Promise<void>

async function runCommand(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: rootDir, stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', status => {
      if (status === 0) resolve()
      else reject(new Error(`Command failed (${status ?? 1}): ${command} ${args.join(' ')}`))
    })
  })
}

interface ReleasePluginDependencies {
  publishCommand?: CommandRunner
  synchronizeVersion?: (version: string) => Promise<void>
  writeOutput?: (path: string, contents: string) => Promise<void>
}

export function createReleasePlugin({
  publishCommand = runCommand,
  synchronizeVersion = setVersion,
  writeOutput = async (path, contents) => appendFile(path, contents, { encoding: 'utf-8' }),
}: ReleasePluginDependencies = {}) {
  return {
    async verifyConditions(_pluginConfig: unknown, { env }: ReleaseContext) {
      if (!env.NPM_TOKEN) throw new Error('NPM_TOKEN is required to publish workspace packages')
    },

    async verifyRelease(_pluginConfig: unknown, { env, nextRelease }: ReleaseContext) {
      assertVersion(nextRelease.version)
      if (env.GITHUB_OUTPUT) {
        await writeOutput(env.GITHUB_OUTPUT, `has-release=true\nversion=${nextRelease.version}\n`)
      }
    },

    async prepare(_pluginConfig: unknown, { nextRelease }: ReleaseContext) {
      await synchronizeVersion(nextRelease.version)
    },

    async publish() {
      await publishCommand('vp', ['run', 'lib-build'])
      await publishCommand('vp', ['pm', 'publish', '-r', '--no-git-checks', '--provenance'])
    },
  }
}

const plugin = createReleasePlugin()
export const { prepare, publish, verifyConditions, verifyRelease } = plugin