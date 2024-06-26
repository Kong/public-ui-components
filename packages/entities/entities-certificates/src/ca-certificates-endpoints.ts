const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/ca_certificates`,
    kongManager: `${KMBaseApiUrl}/ca_certificates`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/ca_certificates`,
      edit: `${konnectBaseApiUrl}/ca_certificates/{id}`,
      validate: `${konnectBaseApiUrl}/v1/schemas/json/ca-certificate/validate`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/ca_certificates`,
      edit: `${KMBaseApiUrl}/ca_certificates/{id}`,
      validate: `${KMBaseApiUrl}/schemas/ca_certificates/validate`,
    },
  },
}
