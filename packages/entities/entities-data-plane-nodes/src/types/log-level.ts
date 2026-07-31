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

export interface LogLevelOperationResponse {
  id: string
}

export type LogLevelOperationStatus =
  | 'in_progress'
  | 'applied'
  | 'reverted'
  | 'superseded'
  | 'failed'
  | 'unsupported'

export interface LogLevelOperationResult {
  node_id: string
  status: LogLevelOperationStatus
}

export interface LogLevelOperationResultsResponse {
  data: LogLevelOperationResult[]
}
