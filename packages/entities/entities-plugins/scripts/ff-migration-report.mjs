#!/usr/bin/env node
import { readdirSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLUGINS_DIR = resolve(__dirname, '../src/components/free-form/plugins')
const OUTPUT_PATH = resolve(__dirname, '../docs/ff-migration-report.md')
const API_URL = 'https://developer.konghq.com/plugins/'

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
  const migrated = kongPlugins.filter(s => localSlugs.has(s))
  const pending = kongPlugins.filter(s => !localSlugs.has(s))
  const pct = Math.round((migrated.length / kongPlugins.length) * 100)

  const BAR_WIDTH = 30
  const filled = Math.round(pct / 100 * BAR_WIDTH)
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)

  const migratedList = migrated.map(s => `- ${s}`).join('\n')
  const pendingList = pending.map(s => `- ${s}`).join('\n')

  return `# Free-form Plugin Migration Report

> ⚠️ **Auto-generated — do not edit manually.**
> To regenerate: \`pnpm --filter @kong-ui-public/entities-plugins report:ff-migration\`
>
> Generated: ${new Date().toISOString()}

## Summary

\`${bar}\` **${pct}%**

| Metric | Count |
|--------|-------|
| 📦 Total Kong Inc plugins | **${kongPlugins.length}** |
| ✅ Migrated | **${migrated.length}** |
| ⏳ Pending | **${pending.length}** |

---

## ✅ Migrated (${migrated.length})

${migratedList}

---

## ⏳ Pending (${pending.length})

${pendingList}
`
}

// --- Main ---
const kongPlugins = await fetchKongIncPlugins()
const localSlugs = readLocalPlugins()
const report = buildReport(kongPlugins, localSlugs)

mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, report, 'utf-8')

const migrated = kongPlugins.filter(s => localSlugs.has(s))
console.log(`Report written to ${OUTPUT_PATH}`)
console.log(`Progress: ${migrated.length}/${kongPlugins.length} (${Math.round(migrated.length / kongPlugins.length * 100)}%)`)
