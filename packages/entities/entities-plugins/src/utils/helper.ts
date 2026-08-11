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

/** Result of matching a search query against a plugin name. */
export interface PluginNameMatch {
  /** Whether the query matches the name at all. */
  matched: boolean
  /** Character indices in the (original) name that should be highlighted. */
  indices: number[]
  /** Ranking score, lower is a better/stronger match. `Infinity` when unmatched. */
  score: number
}

// Match tiers, used as the score base so stronger match types always sort first.
const MATCH_TIER_PREFIX = 0 // name starts with the query
const MATCH_TIER_ACRONYM = 1000 // query matches the leading letters of words in order
const MATCH_TIER_SUBSTRING = 2000 // query appears as a consecutive substring
const MATCH_TIER_SUBSEQUENCE = 3000 // query letters appear in order but scattered
const MATCH_TIER_ID_PREFIX = 4000 // the plugin id starts with the query (name did not match)

const isWordChar = (char: string): boolean => /[a-z0-9]/i.test(char)

/** Return the leading character of every word in `name`, with its index. */
function wordInitials(name: string): Array<{ char: string, index: number }> {
  const initials: Array<{ char: string, index: number }> = []
  for (let i = 0; i < name.length; i++) {
    if (isWordChar(name[i]) && (i === 0 || !isWordChar(name[i - 1]))) {
      initials.push({ char: name[i], index: i })
    }
  }
  return initials
}

/**
 * Greedy leftmost subsequence match: return the index (into `chars`) of each
 * query character in order, or `null` if `query` is not a subsequence.
 */
function subsequenceIndices(query: string, chars: string[]): number[] | null {
  const indices: number[] = []
  let pos = 0
  for (const q of query) {
    while (pos < chars.length && chars[pos] !== q) {
      pos++
    }
    if (pos >= chars.length) {
      return null
    }
    indices.push(pos)
    pos++
  }
  return indices
}

/**
 * Match a search query against a plugin name and describe how strong the match
 * is (for ranking) and which characters matched (for highlighting).
 *
 * Ranking, strongest first:
 *  - prefix: the name starts with the query
 *  - acronym: the query is a subsequence of the words' leading letters, in
 *    order (intervening words may be skipped, e.g. "ae" matches
 *    "Access Control Enforcement")
 *  - substring: the query appears as a consecutive run
 *  - subsequence: the query letters appear in order but scattered
 *
 * When a `id` is supplied and the name does not match, a stricter fallback is
 * tried: the plugin id must *start with* the query (e.g. "ai-prompt-decorator").
 * Id matches are returned with no highlight indices (the UI highlights the name
 * only) and rank below every name match.
 */
export function matchPluginName(rawQuery: string, name: string, id?: string): PluginNameMatch {
  const query = rawQuery.toLowerCase()
  if (!query) {
    return { matched: true, indices: [], score: 0 }
  }

  const lcName = name.toLowerCase()
  const range = (start: number, length: number) =>
    Array.from({ length }, (_, i) => start + i)

  // Tier 0 — prefix substring
  if (lcName.startsWith(query)) {
    return { matched: true, indices: range(0, query.length), score: MATCH_TIER_PREFIX }
  }

  // Tier 1 — word initials (acronym)
  const initials = wordInitials(lcName)
  const acronym = subsequenceIndices(query, initials.map(i => i.char))
  if (acronym) {
    const indices = acronym.map(i => initials[i].index)
    return { matched: true, indices, score: MATCH_TIER_ACRONYM + indices[0] }
  }

  // Tier 2 — consecutive substring anywhere
  const at = lcName.indexOf(query)
  if (at >= 0) {
    return { matched: true, indices: range(at, query.length), score: MATCH_TIER_SUBSTRING + at }
  }

  // Tier 3 — scattered subsequence
  const subseq = subsequenceIndices(query, lcName.split(''))
  if (subseq) {
    return { matched: true, indices: subseq, score: MATCH_TIER_SUBSEQUENCE + subseq[0] }
  }

  // Tier 4 — id prefix (strict fallback, no highlight)
  if (id && id.toLowerCase().startsWith(query)) {
    return { matched: true, indices: [], score: MATCH_TIER_ID_PREFIX }
  }

  return { matched: false, indices: [], score: Infinity }
}

/**
 * Split `text` into consecutive segments flagged as highlighted or not, based
 * on the (sorted) matched character `indices`.
 */
export function buildHighlightSegments(
  text: string,
  indices: number[] = [],
): Array<{ text: string, highlighted: boolean }> {
  if (!indices.length) {
    return text ? [{ text, highlighted: false }] : []
  }

  const highlighted = new Set(indices)
  const segments: Array<{ text: string, highlighted: boolean }> = []
  let current = ''
  let currentHighlighted = highlighted.has(0)

  for (let i = 0; i < text.length; i++) {
    const isHighlighted = highlighted.has(i)
    if (isHighlighted !== currentHighlighted && current) {
      segments.push({ text: current, highlighted: currentHighlighted })
      current = ''
    }
    currentHighlighted = isHighlighted
    current += text[i]
  }
  if (current) {
    segments.push({ text: current, highlighted: currentHighlighted })
  }
  return segments
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

export function within16Weeks(targetTs: number) {
  const nowTs = Date.now()
  const SIXTEEN_WEEKS_MS = 16 * 7 * 24 * 60 * 60 * 1000
  return Math.abs(nowTs - targetTs) <= SIXTEEN_WEEKS_MS
}

export function removeOauthbearer(payload: Record<string, any>) {
  if (isEqual(payload.config?.oauthbearer, {
    extensions: {},
    token_endpoint_tls_verify: true,
  })) {
    payload.config.oauthbearer = null
  }
}
