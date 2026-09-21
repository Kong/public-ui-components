const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}'
const kongManagerBaseApiUrl = '/debug/cluster'

export default {
  logLevel: {
    konnect: {
      update: `${konnectBaseApiUrl}/nodes/log-level-operations`,
      results: `${konnectBaseApiUrl}/nodes/log-level-operations/{operationId}/results`,
    },
    kongManager: {
      update: `${kongManagerBaseApiUrl}/data-planes/log-level-operations`,
      results: `${kongManagerBaseApiUrl}/data-planes/log-level-operations/{operationId}/results?size=1000`,
    },
  },
}
