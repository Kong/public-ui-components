import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { GatewayServiceConfigCardView } from '../index'

describe('<GatewayServiceConfigCardView />', () => {
  testConfigCardView('GatewayServiceConfigCardView', GatewayServiceConfigCardView, { record: { id: 'service', name: 'service-name', tls_verify: true } })
})
