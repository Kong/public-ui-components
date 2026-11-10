import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { ConsumerGroupConfigCardView } from '../index'

describe('<ConsumerGroupConfigCardView />', () => {
  testConfigCardView('ConsumerGroupConfigCardView', ConsumerGroupConfigCardView, { record: { id: 'group', name: 'group-name' } })
})
