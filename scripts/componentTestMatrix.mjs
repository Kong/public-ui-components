#!/usr/bin/env node
/**
 * Builds the GitHub Actions matrix for Cypress component tests.
 *
 * A package that fits in one job keeps its one-to-one job, exactly like before.
 * A larger package is split in two passes:
 *
 *   1. Walk the package's own directory tree top down. A directory is only cut
 *      when it is over budget AND its children are few enough for the cut to be
 *      meaningful — a deep tree of one-spec directories is left alone and cut by
 *      file name instead.
 *   2. Merge the resulting pieces back together in path order, so no job ends up
 *      carrying a lone spec that could have ridden along with a neighbour.
 *
 * Every job therefore covers a contiguous slice of the package's directory tree,
 * and its name names that slice: the directory it belongs to, plus the file range
 * when it only covers part of that directory.
 *
 * Usage: node scripts/componentTestMatrix.mjs <package-dir>... [--cap N]
 */

import { readdirSync } from 'node:fs'
import { join, basename, sep } from 'node:path'

const PACKAGES = []
let CAP = Number(process.env.COMPONENT_TEST_MAX_SPECS ?? 8)

const args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--cap') CAP = Number(args[++i])
  else PACKAGES.push(args[i])
}

// Cutting a directory into many one-spec pieces costs a runner each and buys nothing.
const MAX_FANOUT = Math.max(2, Math.floor(CAP / 2))

// Mirrors excludeSpecPattern in cypress.config.ts.
const SKIP_DIRS = new Set(['node_modules', '__template__'])

/** Every *.cy.ts below `dir`, depth first, sorted by path. */
function collectSpecs(dir) {
  const out = []
  const walk = (current) => {
    let entries
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full)
      } else if (entry.name.endsWith('.cy.ts')) {
        out.push(full.split(sep).join('/'))
      }
    }
  }
  walk(dir)
  return out
}

/** `packages/entities/entities-plugins/src/components/free-form` -> `entities-plugins/components/free-form` */
function label(path) {
  const match = path.match(/^packages\/[^/]+\/([^/]+)\/src\/?(.*)$/)
  return match ? [match[1], match[2]].filter(Boolean).join('/') : path
}

function slug(path) {
  return path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function chunkEvenly(list, size) {
  const chunks = Math.ceil(list.length / size)
  const per = Math.ceil(list.length / chunks)
  const out = []
  for (let i = 0; i < list.length; i += per) out.push(list.slice(i, i + per))
  return out
}

/** Buckets `specs` by the path segment after `prefix`. A leading '' bucket holds files sitting directly in `prefix`. */
function bucketBySegment(prefix, specs) {
  const buckets = new Map()
  for (const spec of specs) {
    const rest = spec.slice(prefix.length + 1)
    const slash = rest.indexOf('/')
    const segment = slash === -1 ? '' : rest.slice(0, slash)
    if (!buckets.has(segment)) buckets.set(segment, [])
    buckets.get(segment).push(spec)
  }
  return buckets
}

/** Full spec count of every directory that has specs below it. */
function countByDir(specs) {
  const counts = new Map()
  for (const spec of specs) {
    const parts = spec.split('/')
    for (let i = 1; i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/')
      counts.set(dir, (counts.get(dir) ?? 0) + 1)
    }
  }
  return counts
}

/** Pass 1: cut the directory tree into pieces of at most CAP specs. */
function atoms(prefix, specs) {
  if (specs.length <= CAP) return [{ path: prefix, specs }]

  const buckets = bucketBySegment(prefix, specs)
  const hasSubdirectories = [...buckets.keys()].some((segment) => segment !== '')
  const worthCutting = hasSubdirectories && buckets.size <= MAX_FANOUT

  if (!worthCutting) {
    return chunkEvenly(specs, CAP).map((chunk) => ({ path: prefix, specs: chunk }))
  }

  return [...buckets].flatMap(([segment, group]) =>
    atoms(segment === '' ? prefix : `${prefix}/${segment}`, group),
  )
}

/** Pass 2: merge neighbouring pieces in path order so no job carries a lone spec. */
function mergeNeighbours(pieces) {
  const merged = []
  for (const piece of pieces) {
    const last = merged[merged.length - 1]
    if (last && last.specs.length + piece.specs.length <= CAP) {
      last.specs.push(...piece.specs)
      last.path = commonDir(last.path, piece.path)
    } else {
      merged.push({ path: piece.path, specs: [...piece.specs] })
    }
  }
  return merged
}

function commonDir(a, b) {
  const left = a.split('/')
  const right = b.split('/')
  const shared = []
  for (let i = 0; i < Math.min(left.length, right.length) && left[i] === right[i]; i++) shared.push(left[i])
  return shared.join('/')
}

/** The directory a job belongs to, plus the file range when it only covers part of that directory. */
function nameOf(group, counts) {
  if (group.specs.length === counts.get(group.path)) return label(group.path)

  const first = basename(group.specs[0], '.cy.ts')
  const last = basename(group.specs[group.specs.length - 1], '.cy.ts')
  return first === last ? `${label(group.path)} (${first})` : `${label(group.path)} (${first}…${last})`
}

function main() {
  const matrix = []

  for (const pkg of new Set(PACKAGES)) {
    const specs = collectSpecs(join(pkg, 'src'))
    if (specs.length === 0) continue

    const counts = countByDir(specs)
    const groups = mergeNeighbours(atoms(`${pkg}/src`, specs))

    for (const [index, group] of groups.entries()) {
      matrix.push({
        name: nameOf(group, counts),
        id: `${slug(pkg)}-${index}`,
        spec: group.specs.join(','),
      })
    }
  }

  for (const entry of matrix) {
    process.stderr.write(`  ${entry.name}  (${entry.spec.split(',').length} specs)\n`)
  }

  process.stdout.write(matrix.length ? `${JSON.stringify(matrix)}\n` : '')
}

main()
