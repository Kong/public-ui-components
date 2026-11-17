<template>
  <!-- Always mounted: it holds the sticky position and the live region -->
  <div class="ff-error-summary-container">
    <!-- Announces the count as errors show up and change; a whole-list `alert` would re-read every change -->
    <div
      aria-live="polite"
      class="ff-error-summary-status"
    >
      {{ errors.length ? i18n.t('plugins.form.error_summary.count', { count: errors.length }) : '' }}
    </div>

    <section
      v-if="errors.length"
      class="ff-error-summary"
      data-testid="ff-error-summary"
    >
      <div class="ff-error-summary-header">
        <DangerCircleIcon
          class="ff-error-summary-icon"
          decorative
          :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
        />
        <div class="ff-error-summary-title">
          {{ i18n.t('plugins.form.error_summary.count', { count: errors.length }) }}
        </div>
        <button
          :aria-controls="listId"
          :aria-expanded="expanded"
          :aria-label="expanded ? i18n.t('plugins.form.error_summary.hide') : i18n.t('plugins.form.error_summary.show')"
          class="ff-error-summary-toggle"
          data-testid="ff-error-summary-toggle"
          type="button"
          @click="expanded = !expanded"
        >
          <ChevronDownIcon
            class="ff-error-summary-toggle-icon"
            decorative
            :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
          />
        </button>
      </div>

      <!-- A grid row from `1fr` to `0fr` animates the height without measuring it -->
      <div
        class="ff-error-summary-body"
        :class="{ 'is-collapsed': !expanded }"
        :inert="!expanded || undefined"
      >
        <!-- Scrolls across the whole alert, so the scrollbar sits at its edge, clear of the text -->
        <div class="ff-error-summary-scroll">
          <ul
            :id="listId"
            class="ff-error-summary-list"
            data-testid="ff-error-summary-list"
          >
            <li
              v-for="(error, index) in errors"
              :key="index"
              :data-testid="`ff-error-summary-item-${error.path}`"
            >
              <template v-if="isLinked(error)">
                <button
                  class="ff-error-summary-link"
                  :title="error.path || undefined"
                  type="button"
                  @click="emit('select', error)"
                >
                  {{ getLabel(error) }}
                </button>:
                {{ error.message }}
              </template>
              <template v-else>
                <span
                  class="ff-error-summary-label"
                  :title="error.path || undefined"
                >{{ getLabel(error) }}:</span>
                {{ error.message }}
              </template>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, toRaw, useId, watch } from 'vue'
import { ChevronDownIcon, DangerCircleIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import useI18n from '../../../composables/useI18n'
import { getErrorLabel } from '../error-label'

import type { FieldError, FormSchema } from '@kong-ui-public/freeform'

/**
 * A danger alert that sticks to the bottom of the page and lists the form's errors.
 * Expanded (the default), it lists each one; collapsed, it shows how many there are.
 * Clicking an error emits `select`, so the host can reveal its field. When errors
 * show up (on mount, or after there were none), it emits `select` for the first
 * error that can be clicked, so the host can take the user there at once.
 */

const props = defineProps<{
  errors: FieldError[]
  /** Errors no field shows; listed, but not clickable */
  unmatchedErrors?: FieldError[]
  /** Labels the fields readably; without it they are labeled from the path alone */
  schema?: FormSchema
}>()

const emit = defineEmits<{
  select: [error: FieldError]
}>()

const expanded = defineModel<boolean>('expanded', { default: true })

const { i18n } = useI18n()

const listId = useId()

function getLabel(error: FieldError) {
  return getErrorLabel(error.path, props.schema) || i18n.t('plugins.form.error_summary.entity')
}

function isLinked(error: FieldError) {
  // The host may pass reactive copies of some lists and raw ones of others
  return !props.unmatchedErrors?.some(unmatched => toRaw(unmatched) === toRaw(error))
}

function selectFirstLinked() {
  const first = props.errors.find(isLinked)
  if (first) {
    emit('select', first)
  }
}

// `post`: runs after the host has rendered, so it has passed the `unmatchedErrors`
// of the new errors. Not `immediate`, which would run at once, during setup.
watch(() => props.errors.length > 0, (hasErrors) => {
  if (hasErrors) {
    selectFirstLinked()
  }
}, { flush: 'post' })

// Mounted with errors: the host may pass `unmatchedErrors` only after its own mount,
// e.g. from a template ref to the form, which takes one more render
onMounted(async () => {
  if (props.errors.length) {
    await nextTick()
    selectFirstLinked()
  }
})
</script>

<style lang="scss" scoped>
// The text column starts after the icon; the list is indented to match it on both sides
$indent: calc(var(--kui-space-50, #{$kui-space-50}) + var(--kui-icon-size-40, #{$kui-icon-size-40}) + var(--kui-space-30, #{$kui-space-30}));

.ff-error-summary-container {
  bottom: 0;
  position: sticky;
  z-index: 10;
}

// Read by screen readers only
.ff-error-summary-status {
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

// Looks like a `KAlert` with the `danger` appearance
.ff-error-summary {
  background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  box-sizing: border-box;
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
}

.ff-error-summary-header {
  align-items: flex-start;
  display: flex;
  gap: var(--kui-space-30, $kui-space-30);
  padding: var(--kui-space-50, $kui-space-50);
}

.ff-error-summary-icon {
  flex-shrink: 0;
}

.ff-error-summary-title {
  flex: 1;
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

.ff-error-summary-toggle {
  background: none;
  border: none;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  padding: 0;

  &:hover {
    color: var(--kui-color-text-danger-strong, $kui-color-text-danger-strong);
  }
}

.ff-error-summary-toggle-icon {
  transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

  [aria-expanded="false"] > & {
    transform: rotate(180deg);
  }
}

.ff-error-summary-body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

  &.is-collapsed {
    grid-template-rows: 0fr;
  }
}

.ff-error-summary-scroll {
  max-height: 240px;
  min-height: 0;
  overflow-y: auto;
}

.ff-error-summary-list {
  list-style: none;
  margin: 0;
  overflow-wrap: anywhere;
  padding: 0 $indent var(--kui-space-50, $kui-space-50);

  li + li {
    margin-top: var(--kui-space-50, $kui-space-50);
  }
}

.ff-error-summary-label {
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

// A link, as in a `KAlert`, darker than the message
.ff-error-summary-link {
  background: none;
  border: none;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: var(--kui-color-text-danger-strong, $kui-color-text-danger-strong);
  cursor: pointer;
  font: inherit;
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  padding: 0;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: var(--kui-color-text-danger-stronger, $kui-color-text-danger-stronger);
    text-decoration-thickness: 2px;
  }
}

.ff-error-summary-link,
.ff-error-summary-toggle {
  &:focus-visible {
    box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    outline: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ff-error-summary-body,
  .ff-error-summary-toggle-icon {
    transition: none;
  }
}
</style>
