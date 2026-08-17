const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/services`,
      search: `${konnectBaseApiUrl}/services/search`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/services`,
    },
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/services`,
      edit: `${konnectBaseApiUrl}/services/{id}`,
      getCertificates: `${konnectBaseApiUrl}/certificates`,
      getCaCertificates: `${konnectBaseApiUrl}/ca_certificates`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/services`,
      edit: `${KMBaseApiUrl}/services/{id}`,
      getCertificates: `${KMBaseApiUrl}/certificates`,
      getCaCertificates: `${KMBaseApiUrl}/ca_certificates`,
    },
  },
  relatedEntities: {
    konnect: {
      routes: `${konnectBaseApiUrl}/services/{id}/routes`,
      plugins: `${konnectBaseApiUrl}/services/{id}/plugins`,
    },
  },
}
