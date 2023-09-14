const konnectBaseApiUrl = '/api/control_planes/{controlPlaneId}'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/consumer_groups`,
      forConsumer: `${konnectBaseApiUrl}/consumers/{consumerId}/consumer_groups`,
      oneForConsumer: `${konnectBaseApiUrl}/consumers/{consumerId}/consumer_groups/{consumerGroupId}`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/consumer_groups?counter=true`,
      forConsumer: `${KMBaseApiUrl}/consumers/{consumerId}/consumer_groups`,
      oneForConsumer: `${KMBaseApiUrl}/consumers/{consumerId}/consumer_groups/{consumerGroupId}`,
    },
  },
  form: {
    konnect: {
      consumersList: `${konnectBaseApiUrl}/consumers`,
      create: `${konnectBaseApiUrl}/consumer_groups`,
      edit: `${konnectBaseApiUrl}/consumer_groups/{id}`,
      addConsumer: `${konnectBaseApiUrl}/consumer_groups/{id}/consumers`,
      removeConsumer: `${konnectBaseApiUrl}/consumer_groups/{id}/consumers/{consumerId}`,
      getConsumers: `${konnectBaseApiUrl}/consumer_groups/{id}/consumers`,
    },
    kongManager: {
      consumersList: `${KMBaseApiUrl}/consumers`,
      create: `${KMBaseApiUrl}/consumer_groups`,
      edit: `${KMBaseApiUrl}/consumer_groups/{id}`,
      addConsumer: `${KMBaseApiUrl}/consumer_groups/{id}/consumers`,
      removeConsumer: `${KMBaseApiUrl}/consumer_groups/{id}/consumers/{consumerId}`,
      getConsumers: `${KMBaseApiUrl}/consumer_groups/{id}/consumers`,
    },
  },
}
