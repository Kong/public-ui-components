import { KeyUsagesExtension, KeyUsageFlags, SubjectAlternativeNameExtension, X509Certificate } from '@peculiar/x509'
import type { JsonGeneralName, JsonGeneralNames } from '@peculiar/x509'
import type { X509Meta } from '../types'

export default function useX509() {

  const parseMetaCertificateData = (rawContent: string): X509Meta => {
    if (/{vault:\/\/.*}/g.test(rawContent)) {
      throw new Error('not a X.509 certificate')
    }

    const c = new X509Certificate(rawContent)
    const meta: X509Meta = {
      subject: c.subjectName.toString(),
      issuer: c.issuer,
      notAfter: c.notAfter,
    }

    // c.extensions.forEach((ext: Extension) => {
    for (const ext of c.extensions) {
      if (ext instanceof SubjectAlternativeNameExtension) {
        const extEntries: JsonGeneralNames = ext.names.toJSON()
        const res = Object.entries(extEntries)
          .map((data:[string, JsonGeneralName]) => ({ type: data[1].type, value: data[1].value }))

        const finalRes = res.reduce((acc, obj) => {
          const key = obj.type
          const curGroup = acc[key] as string ?? []

          return { ...acc, [key]: [...curGroup, obj.value] }
        }, {} as any)

        for (const key in finalRes) {
          meta.subjectAltName = `${key}=${finalRes[key].join(', ')}`
        }
      } else if (ext instanceof KeyUsagesExtension) {
        const keyUsageFlags = Object.values(KeyUsageFlags)

        const keyUsageFlagAliases = Array(keyUsageFlags.length / 2)
          .fill(null)
          .reduce((keyUsageFlagAliases, _, i) => {
            const flag = keyUsageFlags[keyUsageFlags.length / 2 + i] as KeyUsageFlags
            if (ext.usages & flag) {
              const alias = keyUsageFlags[i]

              keyUsageFlagAliases.push(alias)
            }

            return keyUsageFlagAliases
          }, [])

        meta.keyUsage = keyUsageFlagAliases
      }
    }
    return meta
  }

  return {
    parseMetaCertificateData,
  }
}
