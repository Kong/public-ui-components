export interface CopyUuidNotifyParam {
  /** The notification type */
  type: 'success' | 'error'
  /** The notification content */
  message: string
}

export interface CopyUuidInstallOptions {
  notify?: (param: CopyUuidNotifyParam) => void
}
