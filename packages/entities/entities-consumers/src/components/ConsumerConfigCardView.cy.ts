import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { ConsumerConfigCardView } from '../index'

describe('<ConsumerConfigCardView />', () => {
  testConfigCardView('ConsumerConfigCardView', ConsumerConfigCardView, { record: { id: 'consumer', username: 'user', custom_id: 'custom' } })
})
