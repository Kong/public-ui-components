import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { UpstreamsConfigCardView } from '../index'

describe('<UpstreamsConfigCardView />', () => {
  testConfigCardView('UpstreamsConfigCardView', UpstreamsConfigCardView, { record: { id: 'upstream', name: 'upstream-name' } })
})
