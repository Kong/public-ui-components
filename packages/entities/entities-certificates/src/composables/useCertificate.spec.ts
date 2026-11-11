import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { useCertificateViewData } from './useCertificate'
import { certificate1, certificate } from '../../fixtures/mockData'

describe('record-driven certificate parsing', () => {
  it('refreshes local parsed metadata when a certificate changes under the same entity ID', () => {
    const original = Object.freeze({ ...certificate1 })
    const replacement = Object.freeze({ ...certificate.data[1], id: original.id })
    const record = shallowRef<typeof original | typeof replacement>(original)
    const data = useCertificateViewData(() => record.value.cert)
    const first = data.value
    record.value = replacement
    const next = data.value
    expect(first.schemaSubject).not.to.equal('')
    expect(next.schemaSubject).not.to.equal(first.schemaSubject)
    expect(original.cert).to.equal(certificate1.cert)
    expect(data.value).to.equal(next)
  })
})
