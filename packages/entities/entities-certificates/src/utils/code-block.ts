export const codeBlockRecordFormatter = (record: Record<string, any>, format: 'json' | 'terraform' | 'yaml' | 'deck') => {
  // the field `metadata` is not supported by either Terraform or decK
  if (format !== 'json') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { metadata, ...recordWithoutMetadata } = record
    return recordWithoutMetadata
  }
  return record
}
