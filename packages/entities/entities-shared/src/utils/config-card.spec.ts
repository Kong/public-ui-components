import { describe, expect, it } from 'vitest'
import { getConfigCardViewConfig } from './config-card'

describe('configuration View context', () => {
  it('projects presentation metadata and local customization without token-generation capabilities', () => {
    const config = {
      app: 'konnect' as const, controlPlaneId: 'cp', entityId: 'entity', apiBaseUrl: '/metadata',
      formatPreferenceKey: 'format', enableDeckConfig: { customization: { generateKonnectPat: async () => 'token' }, calloutPreferenceKey: 'callout' },
    }
    expect(getConfigCardViewConfig(config)).to.deep.equal({
      app: 'konnect', apiBaseUrl: '/metadata', formatPreferenceKey: 'format',
      deckCalloutPreferenceKey: undefined, controlPlaneName: undefined, geoApiServerUrl: undefined, workspace: undefined,
      enableDeckConfig: { customization: true, calloutPreferenceKey: 'callout' },
    })
    expect(config.enableDeckConfig.customization.generateKonnectPat).to.be.a('function')
  })
})
