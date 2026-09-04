<template>
  <!--
    `available` again, though `Field.vue` already tested it to dispatch to
    `ExpressionField`: this component is also placed directly by a plugin that
    lays its value input out itself (rate-limiting-advanced's limit rows), where
    nothing has checked. It is what turns the editor off there when the feature
    gate shadows `expressible`, and it keeps a direct caller from binding an
    editor to a twin path the schema never declared — which would put an
    `expressions` entry in the payload for a field that has none.
  -->
  <div
    v-if="expression.available.value"
    v-show="!expression.hide.value"
    class="ff-expression-editor"
    :data-expression-for="expression.expressionPath.value"
    :data-testid="`ff-expression-${path}`"
  >
    <KButton
      v-if="!expanded"
      appearance="tertiary"
      class="ff-expression-editor-add"
      :data-testid="`ff-expression-add-${path}`"
      @click="expanded = true"
    >
      <AddIcon />
      {{ i18n.t('plugins.free-form.expression.add') }}
    </KButton>

    <div
      v-else
      class="ff-expression-editor-expanded"
    >
      <StringField
        class="ff-expression-editor-input"
        :label="i18n.t('plugins.free-form.expression.label')"
        :label-attributes="labelAttributes"
        multiline
        :name="expressionName"
        :placeholder="placeholder ?? ''"
        :rows="3"
        @update:model-value="rewriteThroughComposable"
      >
        <template #help>
          <slot name="help">
            <i18nT keypath="plugins.free-form.expression.help.text">
              <template #type>
                {{ i18n.t(returnsKey) }}
              </template>
              <template #link>
                <KExternalLink
                  hide-icon
                  :href="externalLinks.condition"
                >
                  {{ i18n.t('plugins.free-form.expression.help.learn') }}
                </KExternalLink>
              </template>
            </i18nT>
          </slot>
        </template>
      </StringField>

      <KButton
        appearance="tertiary"
        :aria-label="i18n.t('plugins.free-form.expression.remove')"
        class="ff-expression-editor-remove"
        :data-testid="`ff-expression-remove-${path}`"
        icon
        @click="remove"
      >
        <CloseIcon />
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import { KButton, KExternalLink } from '@kong/kongponents'
import useI18n from '../../../composables/useFreeformI18n'
import StringField from './StringField.vue'
import externalLinks from '../../../external-links'
import * as utils from './utils'
import { useExpressionField, useFieldPath } from './composables'

import type { EmptyValue } from './types'

defineOptions({ name: 'ExpressionEditor' })

const { name, placeholder } = defineProps<{
  /**
   * Path of the **source** field this expression can override, not the path of
   * the expression itself — the twin path is derived from it. Accepts the same
   * absolute or parent-relative form as any other field component's `name`.
   *
   * Renders nothing when that field has no twin in the schema.
   */
  name: string
  /**
   * Example expression to show while the field is empty. There is no default,
   * on purpose — a useful example is specific to the plugin and the field it
   * overrides, so a shared one would be wrong for most of them.
   *
   * Left unset the field shows nothing rather than falling through to
   * `useFieldAttrs`, whose fallback would offer the field's own default value
   * as the placeholder — misleading here, since an expression is not a value.
   */
  placeholder?: string
}>()

defineSlots<{
  /** Replaces the default help text under the textarea. */
  help?: () => any
}>()

const { i18n, i18nT } = useI18n()

const path = useFieldPath(toRef(() => name))
const expression = useExpressionField(path)

const expressionName = computed(() => utils.resolveRoot(expression.expressionPath.value!))

/**
 * The expression is collapsed behind a trigger while it has no value, so a
 * field that only ever uses its plain value stays a single input. Seeded from
 * the model rather than kept in sync with it: once expanded the editor stays
 * open while the user clears and retypes, and only `remove` collapses it.
 */
const expanded = ref(expression.hasExpression.value)
watch(expression.hasExpression, (hasExpression) => {
  if (hasExpression) expanded.value = true
})

const RETURNS_KEYS = {
  string: 'plugins.free-form.expression.returns.string',
  number: 'plugins.free-form.expression.returns.number',
  integer: 'plugins.free-form.expression.returns.integer',
  boolean: 'plugins.free-form.expression.returns.boolean',
} as const

const returnsKey = computed(() => {
  const type = expression.kongType.value
  // Guards against an `expressible_kong_type` the Gateway adds later that has no
  // phrasing here yet — better a vague sentence than a raw i18n key on screen.
  return type && type in RETURNS_KEYS
    ? RETURNS_KEYS[type as keyof typeof RETURNS_KEYS]
    : 'plugins.free-form.expression.returns.unknown'
})

const labelAttributes = computed(() => ({
  info: i18n.t('plugins.free-form.expression.info'),
  tooltipAttributes: { maxWidth: '300px', placement: 'top' as const },
  'data-testid': `ff-expression-label-${path.value}`,
}))

/**
 * `StringField` binds the twin path itself, so its writes bypass this
 * composable: typing into an untouched slot of a twin array would leave holes
 * in front of it, and emptying the input would write the form's null sentinel —
 * neither of which the Gateway accepts. Re-writing the same value through the
 * composable repairs the array around it. A no-op for a scalar twin.
 */
function rewriteThroughComposable(written: string | EmptyValue) {
  expression.value.value = written
}

function remove() {
  expression.clear()
  expanded.value = false
}
</script>

<style lang="scss" scoped>
// Spacing-neutral on purpose: whoever composes the editor owns the gap between
// it and the input it belongs to (`ExpressionField` for an auto-rendered field,
// the plugin's own form otherwise). A margin here would add to theirs.
.ff-expression-editor {
  .ff-expression-editor-add {
    // The trigger reads as part of the field above it, not as a button block.
    padding-left: 0;
    padding-right: 0;
  }

  .ff-expression-editor-expanded {
    // The rule nests the editor under the field it overrides. Only the editor
    // carries it — a rule beside the bare trigger reads as a stray dash.
    border-left: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-40, $kui-space-40);
    padding-left: var(--kui-space-50, $kui-space-50);
  }

  .ff-expression-editor-input {
    flex-grow: 1;
    // The textarea sits in a flex row with the remove button; without this it
    // refuses to shrink below its intrinsic width on narrow containers.
    min-width: 0;
  }

  .ff-expression-editor-remove {
    // Aligns with the textarea rather than its label.
    align-self: center;
    flex-shrink: 0;
  }
}
</style>
