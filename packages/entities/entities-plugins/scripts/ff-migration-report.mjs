#!/usr/bin/env node
import { readdirSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLUGINS_DIR = resolve(__dirname, '../src/components/free-form/plugins')
const OUTPUT_PATH = resolve(__dirname, '../docs/ff-migration-report.md')
const API_URL = 'https://developer.konghq.com/plugins/'

// ============================================================
// MANUAL CONFIGURATION
// ============================================================

/**
 * Milestone definitions. Each milestone groups a set of plugin slugs.
 *
 * M1–M10 are predefined by the team.
 * M11+ are grouped by category from developer.konghq.com/plugins/.
 * Plugins not listed in any milestone are shown in "Uncategorized".
 *
 * Rule: max 5 plugins per milestone (enforced for M11+).
 *
 * @type {Array<{ id: string, name: string, plugins: string[] }>}
 */
const MILESTONES = [
  // ── M1–M10: team-defined ──────────────────────────────────
  {
    id: 'M1',
    name: 'M1 — Key Auth, Rate Limiting & Core Transformations',
    plugins: ['key-auth', 'rate-limiting', 'jwt', 'route-transformer-advanced', 'request-transformer', 'basic-auth', 'upstream-oauth'],
  },
  {
    id: 'M2',
    name: 'M2 — CORS, ACL & Proxy Cache',
    plugins: ['cors', 'acl', 'proxy-cache', 'proxy-cache-advanced', 'response-transformer'],
  },
  {
    id: 'M3',
    name: 'M3 — AI Proxy Core',
    plugins: ['ai-proxy-advanced', 'ai-proxy', 'ai-prompt-decorator', 'ai-prompt-guard', 'ai-rate-limiting-advanced'],
  },
  {
    id: 'M4',
    name: 'M4 — Analytics & Monitoring Core',
    plugins: ['prometheus', 'file-log', 'http-log', 'correlation-id', 'opentelemetry'],
  },
  {
    id: 'M5',
    name: 'M5 — Advanced Transformations & Serverless',
    plugins: ['request-transformer-advanced', 'response-transformer-advanced', 'aws-lambda', 'exit-transformer'],
  },
  {
    id: 'M6',
    name: 'M6 — Security & Serverless Functions',
    plugins: ['pre-function', 'ip-restriction', 'post-function', 'bot-detection', 'request-size-limiting'],
  },
  {
    id: 'M7',
    name: 'M7 — AI Semantic & Transformers',
    plugins: ['ai-semantic-cache', 'ai-prompt-template', 'ai-semantic-prompt-guard', 'ai-request-transformer', 'ai-response-transformer'],
  },
  {
    id: 'M8',
    name: 'M8 — JWT Signer, Datakit & Advanced Plugins',
    plugins: ['jwt-signer', 'datakit', 'request-callout', 'ai-mcp-proxy', 'service-protection'],
  },
  {
    id: 'M9',
    name: 'M9 — Solace Integration',
    plugins: ['solace-consume', 'solace-log', 'solace-upstream'],
  },
  {
    id: 'M10',
    name: 'M10 — Auth & Session',
    plugins: ['header-cert-auth', 'jwe-decrypt', 'mtls-auth', 'oauth2', 'session'],
  },

  // ── Traffic Control ───────────────────────────────────────
  {
    id: 'M11',
    name: 'M11 — Traffic Control: Rate Limiting',
    plugins: ['rate-limiting-advanced', 'response-ratelimiting', 'graphql-rate-limiting-advanced', 'redirect', 'request-termination'],
  },
  {
    id: 'M12',
    name: 'M12 — Traffic Control: Validation & Routing',
    plugins: ['request-validator', 'canary', 'mocking', 'oas-validation', 'route-by-header'],
  },
  {
    id: 'M13',
    name: 'M13 — Traffic Control: WebSocket & Timeouts',
    plugins: ['websocket-size-limit', 'websocket-validator', 'xml-threat-protection', 'upstream-timeout', 'forward-proxy'],
  },
  {
    id: 'M14',
    name: 'M14 — Traffic Control: Messaging & Access',
    plugins: ['ace', 'confluent-consume', 'kafka-consume', 'standard-webhooks', 'graphql-proxy-cache-advanced'],
  },

  // ── Analytics & Monitoring + Monetization ────────────────
  {
    id: 'M15',
    name: 'M15 — Analytics, Monitoring & Monetization',
    plugins: ['app-dynamics', 'datadog', 'statsd', 'zipkin', 'metering-and-billing'],
  },

  // ── Authentication ────────────────────────────────────────
  {
    id: 'M16',
    name: 'M16 — Authentication: Extended Methods',
    plugins: ['hmac-auth', 'key-auth-enc', 'ldap-auth', 'ldap-auth-advanced', 'oauth2-introspection'],
  },
  {
    id: 'M17',
    name: 'M17 — Authentication: OpenID & Enterprise',
    plugins: ['openid-connect', 'saml', 'vault-auth'],
  },

  // ── Logging ───────────────────────────────────────────────
  {
    id: 'M18',
    name: 'M18 — Logging',
    plugins: ['kafka-log', 'loggly', 'syslog', 'tcp-log', 'udp-log'],
  },

  // ── Security ──────────────────────────────────────────────
  {
    id: 'M19',
    name: 'M19 — Security',
    plugins: ['acme', 'injection-protection', 'json-threat-protection', 'opa', 'tls-handshake-modifier', 'tls-metadata-headers'],
  },

  // ── Transformations & Serverless ─────────────────────────
  {
    id: 'M20',
    name: 'M20 — Transformations & Serverless',
    plugins: ['confluent', 'degraphql', 'grpc-gateway', 'grpc-web'],
  },
  {
    id: 'M21',
    name: 'M21 — Transformations & Serverless (cont.)',
    plugins: ['jq', 'kafka-upstream', 'azure-functions'],
  },

  // ── AI ────────────────────────────────────────────────────
  {
    id: 'M22',
    name: 'M22 — AI: Guardrails',
    plugins: ['ai-a2a-proxy', 'ai-aws-guardrails', 'ai-azure-content-safety', 'ai-custom-guardrail', 'ai-gcp-model-armor'],
  },
  {
    id: 'M23',
    name: 'M23 — AI: Advanced Safety & RAG',
    plugins: ['ai-llm-as-judge', 'ai-lakera-guard', 'ai-mcp-oauth2', 'ai-sanitizer', 'ai-prompt-compressor', 'ai-rag-injector', 'ai-semantic-response-guard'],
  },
]

/**
 * Plugins excluded from tracking (e.g. no UI to migrate).
 *
 * @type {Set<string>}
 */
const EXCLUDED_PLUGINS = new Set([
  'openwhisk', // no UI
])

/**
 * Milestone IDs that have been deployed to production (Complete status).
 * Add a milestone ID here once it has been released.
 *
 * @type {Set<string>}
 */
const RELEASED_MILESTONES = new Set([
  'M1', // key-auth, rate-limiting, jwt, route-transformer-advanced, request-transformer, basic-auth, upstream-oauth
  'M2', // cors, acl, proxy-cache, proxy-cache-advanced, response-transformer
  'M4', // prometheus, file-log, http-log, correlation-id, opentelemetry
  'M5', // request-transformer-advanced, response-transformer-advanced, aws-lambda, exit-transformer
  'M9', // solace-consume, solace-log, solace-upstream
  'M8', // jwt-signer, datakit, request-callout, ai-mcp-proxy, service-protection
])

// ============================================================

const STATUS = /** @type {const} */ ({
  COMPLETE: 'Complete',
  READY: 'Ready for Release',
  IN_PROGRESS: 'In Progress',
  NOT_STARTED: 'Not Started',
})

const STATUS_EMOJI = {
  [STATUS.COMPLETE]: '✅',
  [STATUS.READY]: '🚀',
  [STATUS.IN_PROGRESS]: '🔄',
  [STATUS.NOT_STARTED]: '⏸️',
}

function getMilestoneStatus(milestone, localSlugs) {
  const migratedCount = milestone.plugins.filter(p => localSlugs.has(p)).length
  if (migratedCount === 0) return STATUS.NOT_STARTED
  if (migratedCount < milestone.plugins.length) return STATUS.IN_PROGRESS
  return RELEASED_MILESTONES.has(milestone.id) ? STATUS.COMPLETE : STATUS.READY
}

// --- Fetch Kong Inc plugin slugs from developer.konghq.com ---
async function fetchKongIncPlugins() {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${API_URL}`)
  const html = await res.text()

  const slugs = []
  const cards = html.split(/(?=<div[^>]*data-card="plugin")/)
  for (const card of cards) {
    const support = card.match(/data-support="([^"]+)"/)
    const slug = card.match(/href="\/plugins\/([^/"]+)\/?"/ )
    if (support?.[1].includes('kong-inc') && slug?.[1]) {
      slugs.push(slug[1])
    }
  }
  return [...new Set(slugs)].sort()
}

// --- Read local free-form plugin implementations ---
function readLocalPlugins() {
  const entries = readdirSync(PLUGINS_DIR, { withFileTypes: true })
  const localSlugs = new Set()

  for (const entry of entries) {
    if (entry.name === 'README.md') continue
    if (entry.isDirectory()) {
      localSlugs.add(entry.name)
    } else if (entry.isFile() && extname(entry.name) === '.ts') {
      localSlugs.add(basename(entry.name, '.ts'))
    }
  }
  return localSlugs
}

// --- Generate Markdown report ---
function buildReport(kongPlugins, localSlugs) {
  kongPlugins = kongPlugins.filter(p => !EXCLUDED_PLUGINS.has(p))
  const kongPluginSet = new Set(kongPlugins)

  // Plugins on Kong website not assigned to any configured milestone → Uncategorized
  const configuredPlugins = new Set(MILESTONES.flatMap(m => m.plugins))
  const uncategorized = kongPlugins.filter(p => !configuredPlugins.has(p))

  const allMilestones = [...MILESTONES]
  if (uncategorized.length > 0) {
    allMilestones.push({
      id: 'Uncategorized',
      name: 'Uncategorized',
      plugins: uncategorized,
    })
  }

  const milestonesWithStatus = allMilestones.map(m => ({
    ...m,
    status: getMilestoneStatus(m, localSlugs),
    migratedCount: m.plugins.filter(p => localSlugs.has(p)).length,
  }))

  // Overall progress
  const totalPlugins = kongPlugins.length
  const totalMigrated = kongPlugins.filter(p => localSlugs.has(p)).length
  const pct = Math.round((totalMigrated / totalPlugins) * 100)

  // Count milestones by status
  const statusCounts = Object.fromEntries(Object.values(STATUS).map(s => [s, 0]))
  for (const m of milestonesWithStatus) statusCounts[m.status]++

  const STATUS_ORDER = { [STATUS.COMPLETE]: 0, [STATUS.READY]: 1, [STATUS.IN_PROGRESS]: 2, [STATUS.NOT_STARTED]: 3 }
  const STATUS_CHAR = {
    [STATUS.COMPLETE]: '█',
    [STATUS.READY]: '▓',
    [STATUS.IN_PROGRESS]: '▒',
    [STATUS.NOT_STARTED]: '░',
  }
  const bar = [...milestonesWithStatus]
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    .map(m => STATUS_CHAR[m.status])
    .join('')

  // Build per-milestone markdown sections
  const milestoneSections = milestonesWithStatus.map((m) => {
    const emoji = STATUS_EMOJI[m.status]
    const heading = `${emoji} ${m.name} — ${m.status} (${m.migratedCount}/${m.plugins.length})`

    const pluginList = m.plugins
      .map((p) => {
        const migrated = localSlugs.has(p)
        const inKong = kongPluginSet.has(p)
        const suffix = inKong ? '' : ' ⚠️ *(not found on Kong Inc website)*'
        return `- ${migrated ? '✅' : '⏳'} \`${p}\`${suffix}`
      })
      .join('\n')

    // Complete milestones are collapsed by default
    if (m.status === STATUS.COMPLETE) {
      return `<details>\n<summary><strong>${heading}</strong></summary>\n\n${pluginList}\n\n</details>`
    }
    return `### ${heading}\n\n${pluginList}`
  }).join('\n\n---\n\n')

  return `# Free-form Plugin Migration Report

> ⚠️ **Auto-generated — do not edit manually.**
> To regenerate: \`pnpm --filter @kong-ui-public/entities-plugins report:ff-migration\`
>
> Generated: ${new Date().toISOString()}

## Summary

\`${bar}\` **${pct}%**
> █ complete · ▓ ready for release · ▒ in progress · ░ not started

| Metric | Count |
|--------|-------|
| 📦 Total Kong Inc plugins | **${totalPlugins}** |
| ✅ Migrated | **${totalMigrated}** |
| ⏳ Pending | **${totalPlugins - totalMigrated}** |

### Milestone Status

| Status | Count |
|--------|-------|
| ✅ Complete | **${statusCounts[STATUS.COMPLETE]}** |
| 🚀 Ready for Release | **${statusCounts[STATUS.READY]}** |
| 🔄 In Progress | **${statusCounts[STATUS.IN_PROGRESS]}** |
| ⏸️ Not Started | **${statusCounts[STATUS.NOT_STARTED]}** |

---

## Milestones

${milestoneSections}
`
}

// --- Main ---
const kongPlugins = await fetchKongIncPlugins()
const localSlugs = readLocalPlugins()
const report = buildReport(kongPlugins, localSlugs)

mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, report, 'utf-8')

const totalMigrated = kongPlugins.filter(s => localSlugs.has(s)).length
console.log(`Report written to ${OUTPUT_PATH}`)
console.log(`Progress: ${totalMigrated}/${kongPlugins.length} (${Math.round(totalMigrated / kongPlugins.length * 100)}%)`)
