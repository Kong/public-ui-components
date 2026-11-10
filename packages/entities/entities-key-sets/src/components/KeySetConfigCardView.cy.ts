import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { KeySetConfigCardView } from '../index'

describe('<KeySetConfigCardView />', () => {
  testConfigCardView('KeySetConfigCardView', KeySetConfigCardView, { record: { id: 'set', name: 'set-name' } })
})
