export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Notice = 'notice',
  Warn = 'warn',
  Error = 'error',
  Critical = 'crit',
}

// Ordered most-verbose → least-verbose (matches the select order in the design)
export const LOG_LEVELS: LogLevel[] = [
  LogLevel.Debug,
  LogLevel.Info,
  LogLevel.Notice,
  LogLevel.Warn,
  LogLevel.Error,
  LogLevel.Critical,
]

export interface LogLevelOperationPayload {
  log_level: LogLevel
  ttl: number
  targets: { node_ids: string[] }
}
