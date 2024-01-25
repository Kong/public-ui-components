const KMBaseApiUrl = '' // '/{workspace}'

export default {
  list: {
    konnect: {
      all: '/__stub__',
    },
    kongManager: {
      all: `${KMBaseApiUrl}/assets`,
    },
  },
  form: {
    konnect: {
      validate: '/__stub__',
      create: '/__stub__',
      edit: '/__stub__',
    },
    kongManager: {
      validate: `${KMBaseApiUrl}/schemas/assets/validate`,
      create: `${KMBaseApiUrl}/assets`,
      edit: `${KMBaseApiUrl}/assets/{id}`,
    },
  },
}
