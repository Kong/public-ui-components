import { ref } from 'vue'
import type { X509Meta, EntityRow } from '../types'
import useX509 from './x509Helper'

export default function useCertificate() {
  const certificateData = useX509()
  const certificateDataCache = ref<{ [id: string]: X509Meta | undefined }>({})

  const getDataFromCache = (row: EntityRow): X509Meta | undefined => {
    if (!(row.id in certificateDataCache.value)) {
      try {
        certificateDataCache.value[row.id] = certificateData.parseMetaCertificateData(row.cert)
      } catch {
        certificateDataCache.value[row.id] = undefined
      }
    }
    return certificateDataCache.value[row.id]
  }

  const getCertificateData = (row: EntityRow) => {
    const data = getDataFromCache(row)

    return {
      schemaIssuer: data?.issuer || '',
      schemaSubject: data?.subject || '',
      schemaExpiry: data?.notAfter instanceof Date ? (data.notAfter.getTime() / 1000) : 0,
      schemaSanNames: data?.subjectAltName || '',
      schemaKeyUsages: data?.keyUsage || [],
    }
  }

  return {
    certificateDataCache,
    getCertificateData,
  }
}
