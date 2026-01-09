import { isEqual } from 'lodash-es'

export interface SchemaRegistry {
  confluent?: ConfluentConfig | null
}

export interface ConfluentConfig {
  authentication?: AuthenticationConfig
  /** default `true` */
  ssl_verify?: boolean
}

export interface AuthenticationConfig {
  mode?: 'none' | 'basic' | 'oauth2'
  basic?: BasicAuthConfig
  oauth2?: OAuth2Config
  oauth2_client?: OAuth2ClientConfig
}

export interface BasicAuthConfig {
  username?: string
  password?: string
}

export interface OAuth2Config {
  token_endpoint?: string
  token_headers?: Record<string, string>
  token_post_args?: Record<string, string>
  grant_type?: 'client_credentials' | 'password'
  client_id?: string
  client_secret?: string
  username?: string
  password?: string
  scopes?: string[]
  audience?: string[]
}

export interface OAuth2ClientConfig {
  auth_method?: 'client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'none'
  client_secret_jwt_alg?: 'HS512' | 'HS256'
  http_version?: number
  http_proxy?: string
  http_proxy_authorization?: string
  https_proxy?: string
  https_proxy_authorization?: string
  no_proxy?: string
  timeout?: number
  keep_alive?: boolean
  ssl_verify?: boolean
}

// This is the default value when creating a new plugin.
const defaultConfluent: ConfluentConfig = { authentication: { mode: 'none' }, ssl_verify: true }

// This is the object structure that VFG creates when `confluent` is null on 3.11 and below
const emptyConfluent311: ConfluentConfig = { authentication: { basic: {} } }

// This is the object structure that VFG creates when `confluent` is null on 3.12+
const emptyConfluent312: ConfluentConfig = {
  authentication: {
    basic: {},
    oauth2: {
      token_headers: {},
      token_post_args: {},
    },
    oauth2_client: {},
  },
}

const emptyOrDefaultValues: ConfluentConfig[] = [
  defaultConfluent,
  emptyConfluent311,
  emptyConfluent312,
]

export const stripEmptyBasicFields = (schemaRegistry: SchemaRegistry) => {
  // Remove the default values if the mode is 'none'
  if (schemaRegistry.confluent?.authentication?.mode === 'none') {
    delete schemaRegistry.confluent.authentication.oauth2
    delete schemaRegistry.confluent.authentication.oauth2_client
    delete schemaRegistry.confluent.authentication.basic
  }

  // Remove the default values if the mode is 'basic'
  if (schemaRegistry.confluent?.authentication?.mode === 'basic') {
    delete schemaRegistry.confluent.authentication.oauth2
    delete schemaRegistry.confluent.authentication.oauth2_client
  }

  // Remove the default values if the mode is 'oauth2'
  if (schemaRegistry.confluent?.authentication?.mode === 'oauth2') {
    delete schemaRegistry.confluent.authentication.basic
  }

  // Remove the entire confluent if all are empty or default
  if (emptyOrDefaultValues.some((val) => isEqual(schemaRegistry.confluent, val))) {
    schemaRegistry.confluent = null
  }
}

export function lcsRecursive(a: string, b: string): string {
  const arrA = a.split('')
  const arrB = b.split('')
  const m = arrA.length
  const n = arrB.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  // Build DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arrA[i - 1] === arrB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to get LCS string
  let lcs = ''
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (arrA[i - 1] === arrB[j - 1]) {
      lcs = arrA[i - 1] + lcs
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return lcs
}

export function within16Weeks(targetTs: number, nowTs = Date.now()) {
  const SIXTEEN_WEEKS_MS = 16 * 7 * 24 * 60 * 60 * 1000
  console.log('targetTs, nowTs, diff', targetTs, nowTs, Math.abs(nowTs - targetTs))
  return Math.abs(nowTs - targetTs) <= SIXTEEN_WEEKS_MS
}
