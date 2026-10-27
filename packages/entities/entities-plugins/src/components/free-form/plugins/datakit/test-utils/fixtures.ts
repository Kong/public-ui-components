import { load, JSON_SCHEMA } from 'js-yaml'
import examples from '../examples'

import type { DatakitConfig, DatakitPluginData } from '../types'

export interface GoldenFixture {
  id: string
  pluginData: DatakitPluginData
}

/**
 * Bundled examples parsed the same way the code editor does.
 * They are the golden fixtures: valid configs the UI must handle losslessly.
 */
export const goldenFixtures: GoldenFixture[] = examples.map(({ id, code }) => ({
  id,
  pluginData: {
    config: load(code, { schema: JSON_SCHEMA, json: true }) as DatakitConfig,
  },
}))
