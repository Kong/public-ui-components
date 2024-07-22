export type X509Meta = {
  subject: string
  issuer: string
  notAfter: Date
  subjectAltName?: string
  keyUsage?: string[]
}
