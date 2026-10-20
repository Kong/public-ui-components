import type { PageLayoutAnchor } from '../src'

/**
 * How a sandbox section lets its anchor find it. Between them these cover every way
 * `PageLayoutAnchor` can point at a section:
 *
 * - `id`: the section carries an `id` attribute, and the anchor's `selector` is `#usage`.
 * - `selector`: the section carries a data attribute instead, and the anchor's `selector` is the
 *   attribute selector for it -- for sections that cannot own an `id`.
 * - `element`: the section carries neither, and the page hands `PageLayout` the element itself
 *   from a template ref, with no `selector` at all.
 */
export type SandboxAnchorTarget = 'id' | 'selector' | 'element'

export interface SandboxAnchorSection {
  /** Unique key: the anchor's `key`, and the section's `id` / data attribute value */
  key: string
  label: string
  target: SandboxAnchorTarget
  /** Where the section lands when scrolled to. Omitted sections sit just under the header. */
  offset?: number
}

export const sandboxAnchorSections: SandboxAnchorSection[] = [
  { key: 'usage', label: 'Usage', target: 'id' },
  { key: 'target-models', label: 'Target models', target: 'id' },
  // Targeted by `[data-section="auth-strategies"]` rather than by id
  { key: 'auth-strategies', label: 'Auth strategies', target: 'selector' },
  { key: 'acls', label: 'ACLs', target: 'id' },
  { key: 'policies', label: 'Policies', target: 'id' },
  // Targeted by the element itself: this section renders no id and no data attribute, so the
  // template ref is the only thing that can find it
  { key: 'observability', label: 'Observability', target: 'element' },
  // Deliberately long, to exercise the pill's truncation
  { key: 'load-balancing', label: 'Upstream load balancing algorithm override', target: 'id' },
  // Lands 160px down the scroller rather than tight under the header, to show `offset` at work
  { key: 'connect', label: 'Connect', target: 'id', offset: 160 },
]

/**
 * Builds the `anchors` prop. `elements` holds the template refs `AnchorSections` collected, and is
 * only read for the sections that are targeted that way -- the rest resolve by selector.
 */
export const buildSandboxAnchors = (elements: Record<string, HTMLElement | null>): PageLayoutAnchor[] =>
  sandboxAnchorSections.map((section): PageLayoutAnchor => ({
    key: section.key,
    label: section.label,
    // The `element`-targeted section gets no selector at all -- the ref is the only way to it
    selector: section.target === 'id'
      ? `#${section.key}`
      : section.target === 'selector'
        ? `[data-section="${section.key}"]`
        : undefined,
    element: section.target === 'element' ? elements[section.key] ?? null : undefined,
    offset: section.offset,
  }))
