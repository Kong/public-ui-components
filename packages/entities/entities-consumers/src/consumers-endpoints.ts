const konnectBaseApiUrl = '/api/control_planes/{controlPlaneId}'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/consumers`,
      forConsumerGroup:
        `${konnectBaseApiUrl}/consumer_groups/{consumerGroupId}/consumers`,
      oneForConsumerGroup: `${konnectBaseApiUrl}/consumer_groups/{consumerGroupId}/consumers/{consumerId}`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/consumers`,
      forConsumerGroup:
        `${KMBaseApiUrl}/consumer_groups/{consumerGroupId}/consumers`,
      oneForConsumerGroup: `${KMBaseApiUrl}/consumer_groups/{consumerGroupId}/consumers/{consumerId}`,
    },
  },
  form: {
    konnect: {
      validate: `${konnectBaseApiUrl}/v1/schemas/json/consumer/validate`,
      create: `${konnectBaseApiUrl}/consumers`,
      edit: `${konnectBaseApiUrl}/consumers/{id}`,
    },
    kongManager: {
      validate: `${KMBaseApiUrl}/schemas/consumers/validate`,
      create: `${KMBaseApiUrl}/consumers`,
      edit: `${KMBaseApiUrl}/consumers/{id}`,
    },
  },
}
