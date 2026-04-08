# Review entities-plugins PR

You are reviewing a pull request that contains changes in the `packages/entities/entities-plugins` source code.

The working directory for all relative paths is:
`/Users/tian.tan@konghq.com/Projects/public-ui-components`

---

## Step 1 — Understand Context

Read the free-form system README:
`packages/entities/entities-plugins/src/components/free-form/README.md`

---

## Step 2 — Get PR Changes and Check Out Branch

Fetch the PR diff using the PR number or URL provided by the user.
If the user passed a GitHub URL, extract the PR number from it.

```bash
gh pr view <number> --repo Kong/public-ui-components --json title,body,headRefName,state
gh pr diff <number> --repo Kong/public-ui-components
```

If the PR is already merged or closed, note it but continue with the review.

Check out the PR branch so the dev server runs the PR code. Save current branch name and stash local changes first:
```bash
ORIGINAL_BRANCH=$(git branch --show-current)
git stash -u
git fetch origin <headRefName>
git checkout <headRefName>
pnpm install
```

At the end of the review, restore:
```bash
git checkout "$ORIGINAL_BRANCH" && git stash pop
```

List the changed files and understand the scope:
- Changes in `free-form/shared/` → affects ALL plugins (broad impact)
- Changes in `free-form/<PluginName>/` → affects that specific plugin
- Changes in `filler/` → affects test utilities
- Changes in `composables/` → affects state/data flow everywhere
- Changes in `fixtures/` → affects sandbox/tests only

---

## Step 3 — Identify Affected Plugins

From the changed files, determine which plugins need testing:

1. If a specific plugin folder changed → add that plugin
2. If a shared component changed (e.g. `Field.vue`, `ObjectField.vue`, `ArrayField.vue`, `MapField.vue`) → find where it's most used:
   ```bash
   grep -r "<ComponentName>" packages/entities/entities-plugins/src --include="*.vue" --include="*.ts" -l
   ```
3. If `form-context.ts`, `field.ts`, or `Field.vue` changed → ALL plugins are affected; pick the most representative ones: `rate-limiting`, `request-callout`, `datakit`
4. If unsure which plugins are affected, ask the user

Plugins available in sandbox: any name used in `src/utils/free-form.ts` mapping, plus any standard plugin (e.g. `rate-limiting`, `cors`, `ai-proxy`).

---

## Step 4 — Code Review

Read the changed files carefully. Look for:

**Data flow issues**
- `prepareFormData()` — does it correctly transform API data for display? Watch for missing field mappings, incorrect defaults
- `onChange()` — does it correctly transform form data back for submission? Watch for data loss, type coercion bugs
- `provideFormShared` / `useFormShared` — is reactive state correctly maintained?

**Schema → Component mapping (Field.vue)**
- Is the correct component dispatched for each field type + `one_of` combination?
- Are new field types handled in `Field.vue`'s switch?
- Are new types added to the filler and test utils?

**Render rules**
- Are `bundles` and `dependencies` paths at the same nesting level?
- No circular references in dependencies?

**MapField specifics** (if changed)
- Key/value pair identity tracking — are entries stable across re-renders?
- Are `data-testid` selectors consistent with what filler/tests expect?
- Does the field support both simple string values and complex nested values?

**Test selector renames**
- If selectors changed (e.g. `ff-kv-*` → `ff-map-*`), check all places that reference old names

**TypeScript / prop types**
- Are prop types correct and consistent between parent and child?
- Are any `any` casts hiding type errors?

---

## Step 5 — Dev Server

Check `gh auth status` first — needed for posting the comment at the end.

Check if the dev server is running:
```bash
lsof -ti:5173
```

If not running, start it and wait. Use the root vite binary to avoid pnpm lockfile hash mismatches between branches:
```bash
cd packages/entities/entities-plugins
USE_SANDBOX=true /Users/tian.tan@konghq.com/Projects/public-ui-components/node_modules/.bin/vite > /tmp/entities-plugins-dev.log 2>&1 &
for i in $(seq 1 30); do curl -s http://localhost:5173 > /dev/null && echo "ready after ${i}s" && break; sleep 1; done
```

---

## Step 6 — Run Playwright Helper (Schema + Console Errors)

Set the output directory for this review session:
```bash
OUTPUT_DIR="/tmp/plugin-review-<pr-number>"
rm -rf "$OUTPUT_DIR" && mkdir -p "$OUTPUT_DIR"
```

Run all affected plugins in parallel in a single browser session:
```bash
cd packages/entities/entities-plugins
node playwright/helpers/review-plugin.mjs \
  --plugins <plugin1>,<plugin2>,<plugin3> \
  --output-dir "$OUTPUT_DIR"
```

The helper writes `<plugin>-schema.json` per plugin to `$OUTPUT_DIR` and prints a JSON array to stdout.

From the results for each plugin:
- `schemas.konnect` / `schemas.kongManager` — compare field types against how `Field.vue` dispatches them. Look for fields that would render with the wrong component
- `consoleErrors` — any Vue warnings or JS errors during render
- `networkErrors` — API failures
- `warnings` — auth issues (401), navigation timeouts

If Konnect returns 401 (no auth), warn the user and continue with Kong Manager schema only.

---

## Step 7 — Targeted Screenshots

Only take screenshots when you have identified a specific rendering or layout problem.

For each problem, run the helper in screenshot mode (single plugin, second pass):
```bash
node playwright/helpers/review-plugin.mjs \
  --plugin <pluginName> \
  --screenshot-selector <data-testid> \
  --output-dir "$OUTPUT_DIR"
```

`data-testid` conventions:
- Field: `ff-{dot.path}` → e.g. `ff-config.redis.host`
- Object toggle: `ff-object-toggle-{path}`
- Array item: `ff-array-{path}.{index}`
- Add button: `ff-array-add-{path}`
- Map field: `ff-map-{path}`

---

## Step 8 — Run Tests (Optional)

Only run if the CI results aren't available yet or if you want to verify a specific behaviour locally.

Run Playwright filler tests (fastest, no Cypress needed):
```bash
cd packages/entities/entities-plugins
pnpm run test:pw
```

If Cypress is working, run filtered by what changed:

| Changed area | Spec |
|---|---|
| Shared field components, composables, `Field.vue` | `./src/components/free-form/test/free-form-basic.cy.ts` |
| Render rules, bundle/dependency logic | `./src/components/free-form/test/free-form-render-rules.cy.ts` |
| Redis, `RedisSelector`, `RedisConfigCard` | `./src/components/free-form/test/free-form-redis-selector.cy.ts` |
| General plugin form | `./src/components/PluginForm.cy.ts` |

```bash
BABEL_ENV=cypress pnpm cypress run --component -b chrome \
  --spec '<spec>' --project '../../../.'
```

---

## Step 9 — Summary and Restore

Print a structured summary to the terminal:

```
## PR Review: <title> (#<number>)

### Scope
<what changed and why>

### Affected Plugins
<list>

### Issues Found
#### Critical
- <issue, file:line>

#### Warnings
- <issue, file:line>

#### Suggestions
- <improvement, file:line>

### Schema Analysis
<Konnect / Kong Manager schema observations vs code>

### Test Results
<pass/fail summary, or "deferred to CI">

### Screenshots
<path and what it shows — only if taken>
Generated files: <OUTPUT_DIR>
```

Restore the original branch:
```bash
git checkout "$ORIGINAL_BRANCH" && git stash pop
```

Ask the user:
> Would you like me to save this as a markdown file or post it as a GitHub PR comment?

If saving as markdown, write to `$OUTPUT_DIR/review.md`.

If posting as a PR comment, post only from "### Issues Found" onwards:
```bash
gh pr comment <number> --repo Kong/public-ui-components --body "..."
```
