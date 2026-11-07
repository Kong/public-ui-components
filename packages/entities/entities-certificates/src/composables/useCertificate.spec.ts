import { describe, expect, it } from 'vitest'
import useCertificate from './useCertificate'
import { certificate1, certificate } from '../../fixtures/mockData'

describe('record-driven certificate parsing', () => {
  it('refreshes local parsed metadata when a certificate changes under the same entity ID', () => {
    const { getCertificateData } = useCertificate()
    const original = Object.freeze({ ...certificate1 })
    const replacement = Object.freeze({ ...certificate.data[1], id: original.id })
    const first = getCertificateData(original)
    const next = getCertificateData(replacement)
    expect(first.schemaSubject).not.to.equal('')
    expect(next.schemaSubject).not.to.equal(first.schemaSubject)
    expect(original.cert).to.equal(certificate1.cert)
    expect(getCertificateData(replacement)).to.deep.equal(next)
  })
})
