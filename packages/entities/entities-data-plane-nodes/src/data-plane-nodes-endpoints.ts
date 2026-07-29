const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}'
const kongManagerBaseApiUrl = '/debug/cluster'

export default {
  logLevel: {
    konnect: {
      update: `${konnectBaseApiUrl}/nodes/log-level-operations`,
    },
    kongManager: {
      update: `${kongManagerBaseApiUrl}/data-planes/log-level-operations`,
    },
  },
}
