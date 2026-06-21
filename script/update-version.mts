import pkg from '../package.json' with { type: 'json' }

import {
  estimateReleaseVersion,
  readCurrentReleaseVersion,
  readReleasePlan,
} from './release-utils.mts'
import { setVersion } from './set-version.mts'

const releasePlan = await readReleasePlan({ allowEmpty: true })
const version = estimateReleaseVersion(releasePlan, await readCurrentReleaseVersion())

await setVersion(version)
console.log(pkg.version)