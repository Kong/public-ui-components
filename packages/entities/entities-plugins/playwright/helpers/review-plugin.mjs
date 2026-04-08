#!/usr/bin/env node
/**
 * Playwright helper for entities-plugins PR review.
 *
 * Scan mode (parallel, one browser):
 *   node review-plugin.mjs --plugins <name1>,<name2>,... --output-dir <dir>
 *
 * Screenshot mode (single plugin, second pass after a problem is identified):
 *   node review-plugin.mjs --plugin <name> --screenshot-selector <testid> --output-dir <dir>
 *
 * Outputs per plugin: <output-dir>/<plugin>-schema.json
 * Screenshot output:  <output-dir>/<plugin>--<testid>.png
 * Scan stdout: JSON array of results, one entry per plugin
 */
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const args = process.argv.slice(2)
const getArg = (name) => { const i = args.indexOf(`--${name}`); return i !== -1 ? args[i + 1] : null }

const pluginsArg = getArg('plugins')
const pluginArg = getArg('plugin')
const screenshotSelector = getArg('screenshot-selector')
const outputDir = resolve(getArg('output-dir') || '/tmp/plugin-review')

if (!pluginsArg && !pluginArg) {
  console.error('Usage:')
  console.error('  node review-plugin.mjs --plugins <n1>,<n2>,... --output-dir <dir>')
  console.error('  node review-plugin.mjs --plugin <name> --screenshot-selector <testid> --output-dir <dir>')
  process.exit(1)
}

mkdirSync(outputDir, { recursive: true })

// ── Screenshot mode ──────────────────────────────────────────────────────────
if (pluginArg && screenshotSelector) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const warnings = []

  try {
    await page.goto(`http://localhost:5173/plugin/create/${pluginArg}`, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (err) {
    warnings.push(`Navigation/timeout: ${err.message}`)
  }

  // Expand advanced sections
  const toggles = page.getByText('Show additional settings')
  const count = await toggles.count()
  for (let i = 0; i < count; i++) { try { await toggles.nth(i).click() } catch {} }
  if (count > 0) await page.waitForTimeout(300)

  let screenshotPath = null
  try {
    // :visible + .first() — sandbox shows both Konnect and KM forms side-by-side
    const el = page.locator(`[data-testid="${screenshotSelector}"]:visible`).first()
    screenshotPath = resolve(outputDir, `${pluginArg}--${screenshotSelector}.png`)
    await el.screenshot({ path: screenshotPath })
    console.error(`Screenshot saved: ${screenshotPath}`)
  } catch (err) {
    warnings.push(`Screenshot failed for [data-testid="${screenshotSelector}"]: ${err.message}`)
  }

  await browser.close()
  console.log(JSON.stringify({ plugin: pluginArg, screenshotPath, warnings }))
  process.exit(0)
}

// ── Scan mode (parallel) ─────────────────────────────────────────────────────
const plugins = (pluginsArg ?? pluginArg).split(',').map(p => p.trim()).filter(Boolean)

async function scanPlugin(browser, plugin) {
  const context = await browser.newContext()
  const page = await context.newPage()

  const schemas = { konnect: null, kongManager: null }
  const consoleErrors = []
  const networkErrors = []
  const warnings = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))
  page.on('response', async (response) => {
    const url = response.url()
    // Skip Vite /@fs/ local file serving — those match /schemas/ but aren't API responses
    if (!url.includes('/schemas/') || url.includes('/@fs/')) return

    const status = response.status()
    if (status === 401) { warnings.push(`[401] Auth required — skipping schema: ${url}`); return }
    if (status !== 200) { networkErrors.push(`[${status}] Schema fetch failed: ${url}`); return }

    try {
      const json = await response.json()
      if (url.includes('/us/kong-api/') || url.includes('/eu/kong-api/') || url.includes('/ap/kong-api/')) {
        schemas.konnect = json
      } else if (url.includes('/kong-manager/')) {
        schemas.kongManager = json
      }
    } catch {
      networkErrors.push(`Failed to parse schema JSON from: ${url}`)
    }
  })

  try {
    await page.goto(`http://localhost:5173/plugin/create/${plugin}`, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (err) {
    warnings.push(`Navigation/timeout: ${err.message}`)
  }

  await context.close()

  const result = { plugin, schemas, consoleErrors, networkErrors, warnings }
  writeFileSync(resolve(outputDir, `${plugin}-schema.json`), JSON.stringify(result, null, 2))
  console.error(`[${plugin}] done`)
  return result
}

const browser = await chromium.launch({ headless: true })
console.error(`Scanning ${plugins.length} plugin(s) in parallel: ${plugins.join(', ')}`)

const results = await Promise.all(plugins.map(p => scanPlugin(browser, p)))

await browser.close()

// Print all results to stdout as a JSON array for the skill to parse
console.log(JSON.stringify(results, null, 2))
