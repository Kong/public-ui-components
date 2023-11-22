const konnectBaseApiUrl = '/api/runtime_groups/{controlPlaneId}'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: '/v2/control-planes/{controlPlaneId}/core-entities/consumer_groups',
      forConsumer: '/v2/control-planes/{controlPlaneId}/core-entities/consumers/{consumerId}/consumer_groups',
      oneForConsumer: '/v2/control-planes/{controlPlaneId}/core-entities/consumers/{consumerId}/consumer_groups/{consumerGroupId}',
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
