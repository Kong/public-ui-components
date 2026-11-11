import { describe, expect, it } from 'vitest'
import { getConfigCardViewConfig } from './config-card'

describe('configuration View context', () => {
  it('projects only export metadata without persistence or token-generation capabilities', () => {
    const config = {
      app: 'konnect' as const, controlPlaneId: 'cp', entityId: 'entity', apiBaseUrl: '/metadata',
      formatPreferenceKey: 'format', enableDeckConfig: { customization: { generateKonnectPat: async () => 'token' }, calloutPreferenceKey: 'callout' },
    }
    expect(getConfigCardViewConfig(config)).to.deep.equal({
      app: 'konnect', apiBaseUrl: '/metadata',
      controlPlaneName: undefined, geoApiServerUrl: undefined, workspace: undefined,
    })
    expect(config.enableDeckConfig.customization.generateKonnectPat).to.be.a('function')
  })
})
