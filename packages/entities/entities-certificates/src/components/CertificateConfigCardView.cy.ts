import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { CertificateConfigCardView, CACertificateConfigCardView } from '../index'

describe('<CertificateConfigCardView /> and <CACertificateConfigCardView />', () => {
  testConfigCardView('CertificateConfigCardView', CertificateConfigCardView, { record: { id: 'certificate', key: 'private' } })
  testConfigCardView('CACertificateConfigCardView', CACertificateConfigCardView, { record: { id: 'ca' } })
})
