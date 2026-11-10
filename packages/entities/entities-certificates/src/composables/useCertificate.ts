import { computed, ref } from 'vue'
import type { X509Meta, EntityRow } from '../types'
import useX509 from './x509Helper'

function useCertificateParser() {
  const { parseMetaCertificateData } = useX509()
  return (cert: string): X509Meta | undefined => {
    try {
      return parseMetaCertificateData(cert)
    } catch {
      return undefined
    }
  }
}

function toCertificateData(data: X509Meta | undefined) {
  return {
    schemaIssuer: data?.issuer || '',
    schemaSubject: data?.subject || '',
    schemaExpiry: data?.notAfter instanceof Date ? (data.notAfter.getTime() / 1000) : 0,
    schemaSanNames: data?.subjectAltName || '',
    schemaKeyUsages: data?.keyUsage || [],
  }
}

export function useCertificateViewData(cert: () => string) {
  const parseCertificate = useCertificateParser()
  return computed(() => toCertificateData(parseCertificate(cert())))
}

export default function useCertificate() {
  const parseCertificate = useCertificateParser()
  const certificateDataCache = ref<{ [id: string]: X509Meta | undefined }>({})

  const getDataFromCache = (row: EntityRow): X509Meta | undefined => {
    if (!(row.id in certificateDataCache.value)) {
      certificateDataCache.value[row.id] = parseCertificate(row.cert)
    }
    return certificateDataCache.value[row.id]
  }

  const getCertificateData = (row: EntityRow) => toCertificateData(getDataFromCache(row))

  return {
    certificateDataCache,
    getCertificateData,
  }
}
