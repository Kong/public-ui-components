#!/usr/bin/env node
/**
 * Playwright helper for plugin migration analysis (VFG → free-form).
 *
 * Field scan (run once per engine mode — caller handles env switching):
 *   node migrate-plugin.mjs --plugin <name> --scan freeform|vfg --output-dir <dir>
 *
 * Submit test (server must be in freeform mode):
 *   node migrate-plugin.mjs --plugin <name> --submit-test --payload '{"config":{...}}' --output-dir <dir>
 *
 * Outputs:
 *   freeform-fields.json   fields (ff-* testids, elementType, isAdvanced), schema, consoleErrors
 *   vfg-fields.json        fields (label, elementType, isAdvanced), consoleErrors
 *   submit-result.json     capturedApiRequests, fillLog, consoleErrors, screenshotPaths
 *   <plugin>-freeform.png  full-page screenshot in freeform mode
 *   <plugin>-vfg.png       full-page screenshot in VFG mode
 *   <plugin>-pre-submit.png / <plugin>-post-submit.png
 */
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const args = process.argv.slice(2)
const getArg = (name) => {
  const i = args.indexOf(`--${name}`); return i !== -1 ? args[i + 1] : null
}
const hasFlag = (name) => args.includes(`--${name}`)

const plugin = getArg('plugin')
const scanMode = getArg('scan') // 'freeform' | 'vfg'
const outputDir = resolve(getArg('output-dir') || '/tmp/plugin-migrate')
const isSubmitTest = hasFlag('submit-test')
const payloadArg = getArg('payload')

if (!plugin) {
  console.error('Usage:')
  console.error('  node migrate-plugin.mjs --plugin <name> --scan freeform|vfg --output-dir <dir>')
  console.error('  node migrate-plugin.mjs --plugin <name> --submit-test --payload \'{"config":{...}}\' --output-dir <dir>')
  process.exit(1)
}

if (!scanMode && !isSubmitTest) {
  console.error('Error: must specify --scan freeform|vfg or --submit-test')
  process.exit(1)
}

mkdirSync(outputDir, { recursive: true })

const BASE_URL = 'http://localhost:5173'

// Sub-structural prefixes: these are internal parts of ArrayField/ObjectField, not standalone fields.
// We KEEP ff-array-{path} (ArrayField root) and ff-object-{path} (ObjectField root) as real fields.
const FF_SUB_STRUCTURAL_PREFIXES = [
  'ff-label-', // KLabel elements inside array/object headers
  'ff-array-header-', // ArrayField header section
  'ff-array-basic-container-', // ArrayField inner container div
  'ff-object-header-', // ObjectField header section
  'ff-object-content-', // ObjectField content area
  'ff-object-toggle-', // ObjectField collapse toggle (also covers toggle-btn-, trigger-icon-)
  'ff-object-switch-', // ObjectField nullable switch
  'ff-add-item-btn-', // ArrayField add button
  'ff-tag-', // StringArrayField inner KTagsInput (root ff-{path} is kept)
  'ff-vault-secret-picker-warning-',
]
const FF_STRUCTURAL_EXACT = new Set(['ff-standard-layout-form', 'ff-advanced-fields-container'])
// ff-enum-{path}-items = KPop dropdown content with a search <input> inside — not a field
const FF_ENUM_ITEMS_RE = /^ff-enum-.+-items$/

function isStructuralTestid(testid) {
  if (FF_STRUCTURAL_EXACT.has(testid)) return true
  if (FF_ENUM_ITEMS_RE.test(testid)) return true
  return FF_SUB_STRUCTURAL_PREFIXES.some(p => testid.startsWith(p))
}

function flattenObject(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const k = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flattenObject(val, k))
    } else {
      acc[k] = val
    }
    return acc
  }, {})
}

// Determine element type for a field element.
//
// ff-array-{path}  → ArrayField root   → elementType 'array'
// ff-object-{path} → ObjectField root  → elementType 'object'
// ff-{path}        → leaf field; testid lands on the actual <input>/<textarea> (via KInput/KTextArea
//                    attribute inheritance), or on a wrapper div (KSelect, StringArrayField, etc.)
//
// For leaf fields we check the element's OWN tag first. Searching for 'input' inside an <input>
// returns nothing, so we must check the element itself. Wrapper divs (EnumField/StringArrayField)
// have no native <input>/<select> and show as 'other'.
async function getInputInfo(el, testid) {
  if (testid.startsWith('ff-array-')) return { elementType: 'array', inputType: null }
  if (testid.startsWith('ff-object-')) return { elementType: 'object', inputType: null }

  const own = await el.evaluate(node => ({
    tag: node.tagName.toLowerCase(),
    type: node.getAttribute ? node.getAttribute('type') : null,
  }))

  if (own.tag === 'textarea') return { elementType: 'textarea', inputType: null }
  if (own.tag === 'input') return { elementType: 'input', inputType: own.type || 'text' }
  if (own.tag === 'select') return { elementType: 'select', inputType: null }

  // Wrapper div: EnumField (KSelect/KMultiselect), StringArrayField root, MapField, JsonField, etc.
  // Do NOT search children — ObjectField/ArrayField roots are already handled above,
  // and searching inside KSelect would find its internal search input (false positive).
  return { elementType: 'other', inputType: null }
}

async function expandFreeformAdvanced(page) {
  const toggles = page.getByText('Show additional settings')
  const count = await toggles.count()
  for (let i = 0; i < count; i++) {
    try {
      await toggles.nth(i).click()
    } catch { // ignore click error
    }
  }
  if (count > 0) await page.waitForTimeout(400)
  return count
}

async function expandVFGAdvanced(page) {
  let total = 0
  // FieldAdvanced.vue toggles (older VFG advanced sections)
  const fa = page.locator('[data-testid="advanced-field-dropdown-wrapper"] .advanced-field-title')
  const faCount = await fa.count()
  for (let i = 0; i < faCount; i++) {
    try {
      await fa.nth(i).click()
    } catch { // ignore click error
    }
  }
  total += faCount
  // KCollapse "Show additional settings" triggers (used by FormGenerator group collapsible)
  const kc = page.locator('button.collapse-trigger-content').filter({ hasText: /show additional/i })
  const kcCount = await kc.count()
  for (let i = 0; i < kcCount; i++) {
    try {
      await kc.nth(i).click()
    } catch { // ignore click error
    }
  }
  total += kcCount
  if (total > 0) await page.waitForTimeout(400)
  return total
}

// ── Freeform scan ─────────────────────────────────────────────────────────────
async function scanFreeform() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const schema = { konnect: null, kongManager: null }
  const consoleErrors = []
  const networkErrors = []
  const warnings = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))
  page.on('response', async (response) => {
    const url = response.url()
    if (!url.includes('/schemas/') || url.includes('/@fs/')) return
    const status = response.status()
    if (status === 401) {
      warnings.push(`[401] Auth required — skipping schema: ${url}`); return
    }
    if (status !== 200) {
      networkErrors.push(`[${status}] Schema fetch failed: ${url}`); return
    }
    try {
      const json = await response.json()
      if (url.includes('/us/kong-api/') || url.includes('/eu/kong-api/') || url.includes('/ap/kong-api/')) {
        schema.konnect = json
      } else if (url.includes('/kong-manager/')) {
        schema.kongManager = json
      }
    } catch {
      networkErrors.push(`Failed to parse schema JSON from: ${url}`)
    }
  })

  try {
    await page.goto(`${BASE_URL}/plugin/create/${plugin}`, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (err) {
    warnings.push(`Navigation/timeout: ${err.message}`)
  }

  const advancedCount = await expandFreeformAdvanced(page)

  // Collect all ff-* field elements (deduplicated by testid)
  const fields = []
  const seen = new Set()

  const allFF = await page.locator('[data-testid^="ff-"]:visible').all()
  for (const el of allFF) {
    const testid = await el.getAttribute('data-testid')
    if (!testid || seen.has(testid) || isStructuralTestid(testid)) continue
    seen.add(testid)

    const { elementType, inputType } = await getInputInfo(el, testid)

    const isAdvanced = await el.evaluate(node => {
      let n = node
      while (n) {
        if (n.getAttribute && n.getAttribute('data-testid') === 'ff-advanced-fields-container') return true
        n = n.parentElement
      }
      return false
    })

    fields.push({ testid, elementType, inputType, isAdvanced })
  }

  const screenshotPath = resolve(outputDir, `${plugin}-freeform.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  await browser.close()

  const result = {
    plugin, mode: 'freeform',
    fields,
    fieldCount: fields.length,
    advancedSectionsExpanded: advancedCount,
    schema, consoleErrors, networkErrors, warnings,
    screenshotPath,
  }
  writeFileSync(resolve(outputDir, 'freeform-fields.json'), JSON.stringify(result, null, 2))
  console.error(`[freeform] done — ${fields.length} fields, screenshot: ${screenshotPath}`)
  console.log(JSON.stringify(result, null, 2))
}

// ── VFG scan ─────────────────────────────────────────────────────────────────
async function scanVFG() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const consoleErrors = []
  const warnings = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  try {
    await page.goto(`${BASE_URL}/plugin/create/${plugin}`, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (err) {
    warnings.push(`Navigation/timeout: ${err.message}`)
  }

  // Check that VFG actually rendered (not freeform)
  const ffForm = await page.locator('[data-testid="ff-standard-layout-form"]').count()
  if (ffForm > 0) {
    warnings.push('WARNING: freeform layout detected — server may still be in freeform mode, not VFG')
  }

  const advancedCount = await expandVFGAdvanced(page)

  // Collect form groups — deduplicate by label (page has two forms side-by-side)
  const fields = []
  const seen = new Set()

  const formGroups = await page.locator('.form-group').all()
  for (const group of formGroups) {
    if (!await group.isVisible()) continue

    let label = ''
    try {
      // .form-group-label span or KLabel rendered text
      const labelEl = group.locator('.form-group-label').first()
      if (await labelEl.count()) {
        label = (await labelEl.innerText() || '').split('\n')[0].trim()
      }
      if (!label) {
        label = (await group.locator('label').first().innerText() || '').split('\n')[0].trim()
      }
    } catch { // ignore click error
    }

    if (!label || seen.has(label)) continue
    seen.add(label)

    const { elementType, inputType } = await getInputInfo(group, 'ff-vfg')

    const isAdvanced = await group.evaluate(node => {
      let n = node
      while (n) {
        if (n.classList && n.classList.contains('advanced-field-dropdown')) return true
        n = n.parentElement
      }
      return false
    })

    fields.push({ label, elementType, inputType, isAdvanced })
  }

  const screenshotPath = resolve(outputDir, `${plugin}-vfg.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  await browser.close()

  const result = {
    plugin, mode: 'vfg',
    fields,
    fieldCount: fields.length,
    advancedSectionsExpanded: advancedCount,
    consoleErrors, warnings,
    screenshotPath,
  }
  writeFileSync(resolve(outputDir, 'vfg-fields.json'), JSON.stringify(result, null, 2))
  console.error(`[vfg] done — ${fields.length} fields, screenshot: ${screenshotPath}`)
  console.log(JSON.stringify(result, null, 2))
}

// ── Submit test ───────────────────────────────────────────────────────────────
async function runSubmitTest() {
  const payload = JSON.parse(payloadArg || '{}')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const capturedRequests = []
  const consoleErrors = []
  const consoleUpdatePayloads = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') consoleErrors.push(text)
    // PluginFormPage logs: console.log('update', payload)
    if (text.startsWith('update ')) consoleUpdatePayloads.push(text)
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  // Mock plugin create/update endpoints for both Konnect and KM
  await page.route('**/plugins', async (route) => {
    const req = route.request()
    if (['POST', 'PUT', 'PATCH'].includes(req.method())) {
      let body = {}
      try {
        body = JSON.parse(req.postData() || '{}')
      } catch { // ignore click error
      }
      capturedRequests.push({ url: req.url(), method: req.method(), body })
      await route.fulfill({
        status: req.method() === 'POST' ? 201 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-plugin-id', name: plugin, ...body }),
      })
    } else {
      await route.continue()
    }
  })

  try {
    await page.goto(`${BASE_URL}/plugin/create/${plugin}`, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (err) {
    consoleErrors.push(`Navigation/timeout: ${err.message}`)
  }

  await expandFreeformAdvanced(page)

  // Fill fields from flattened payload
  const flatPayload = flattenObject(payload)
  const fillLog = []

  for (const [path, value] of Object.entries(flatPayload)) {
    const testid = `ff-${path}`
    const el = page.locator(`[data-testid="${testid}"]`).first()
    if (!await el.count()) {
      fillLog.push(`[skip] ${testid} — not found`); continue
    }

    try {
      // The data-testid may be on the <input>/<textarea> itself (StringField/NumberField/BooleanField
      // pass it through KInput/KTextArea/KCheckbox via v-bind="$attrs"). Check own tag first.
      const own = await el.evaluate(node => ({
        tag: node.tagName.toLowerCase(),
        type: node.getAttribute ? node.getAttribute('type') : null,
      }))

      if (own.tag === 'textarea') {
        await el.fill(String(value))
        fillLog.push(`[textarea] ${testid} = ${JSON.stringify(value)}`)
      } else if (own.tag === 'input') {
        if (own.type === 'checkbox') {
          await el.setChecked(Boolean(value))
          fillLog.push(`[checkbox] ${testid} = ${value}`)
        } else {
          await el.fill(String(value))
          fillLog.push(`[input:${own.type || 'text'}] ${testid} = ${JSON.stringify(value)}`)
        }
      } else {
        // Wrapper div (EnumField/StringArrayField) — can't fill via simple input interaction
        fillLog.push(`[skip] ${testid} — wrapper element, no direct fill (enum/array/map?)`)
      }
    } catch (err) {
      fillLog.push(`[error] ${testid}: ${err.message}`)
    }
  }

  const preSubmitPath = resolve(outputDir, `${plugin}-pre-submit.png`)
  await page.screenshot({ path: preSubmitPath, fullPage: true })

  // Click submit (Konnect form = first submit button on page)
  let submitError = null
  try {
    const btn = page.locator('[data-testid="plugin-create-form-submit"]').first()
    await btn.click()
    // Wait for API mock to fire and form to react
    await page.waitForTimeout(2000)
  } catch (err) {
    submitError = err.message
  }

  const postSubmitPath = resolve(outputDir, `${plugin}-post-submit.png`)
  await page.screenshot({ path: postSubmitPath, fullPage: true })

  await browser.close()

  const result = {
    plugin, mode: 'freeform',
    fillPayload: flatPayload,
    fillLog,
    capturedRequests,
    consoleUpdatePayloads,
    submitError,
    consoleErrors,
    screenshots: { preSubmit: preSubmitPath, postSubmit: postSubmitPath },
  }
  writeFileSync(resolve(outputDir, 'submit-result.json'), JSON.stringify(result, null, 2))
  console.error(`[submit-test] done — ${capturedRequests.length} API requests captured`)
  console.log(JSON.stringify(result, null, 2))
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (isSubmitTest) {
  await runSubmitTest()
} else if (scanMode === 'freeform') {
  await scanFreeform()
} else if (scanMode === 'vfg') {
  await scanVFG()
}
