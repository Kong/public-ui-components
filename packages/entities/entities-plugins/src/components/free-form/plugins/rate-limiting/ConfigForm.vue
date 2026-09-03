<template>
  <!--
    The fields that lead the form, in this order. `CommonForm`'s grouping would
    put `limit_by` in the Advanced section below — it is neither required nor
    named in an entity check — but it decides what the limits are counted
    against, so it has to be read before them.
  -->
  <ObjectField
    as-child
    class="ff-default-visible-fields"
    :fields-order="PRIMARY_FIELDS"
    name="config"
    :omit="advancedFields"
    reset-label-path="reset"
  >
    <!--
      A named slot overrides one child of the record without giving up the
      auto-rendering of its siblings, their order, or the entity-checks alert.
      `custom_key` overrides the counter key rather than a limit, so its
      expression copy is its own.
    -->
    <template #custom_key="{ name }">
      <ExpressionField
        :name="name"
        :placeholder="t('sp.custom_key.expression_placeholder')"
      >
        <template #help>
          <i18nT keypath="sp.custom_key.expression_help.text">
            <template #link>
              <KExternalLink
                hide-icon
                :href="externalLinks.condition"
              >
                {{ t('sp.custom_key.expression_help.learn') }}
              </KExternalLink>
            </template>
          </i18nT>
        </template>
      </ExpressionField>
    </template>
  </ObjectField>

  <AdvancedFields
    class="ff-advanced-fields-container"
    data-testid="ff-advanced-fields-container"
    hide-general-fields
  >
    <ObjectField
      as-child
      name="config"
      :omit="PRIMARY_FIELDS"
      reset-label-path="reset"
    />
  </AdvancedFields>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KExternalLink } from '@kong/kongponents'
import ObjectField from '../../shared/ObjectField.vue'
import ExpressionField from '../../shared/ExpressionField.vue'
import externalLinks from '../../../../external-links'
import useI18n from '../../../../composables/useI18n'
import AdvancedFields from '../../shared/AdvancedFields.vue'
import { useFormShared } from '../../shared/composables'

import type { RecordFieldSchema } from '../../../../types/plugins/form-schema'

/**
 * `limit_by` and the `custom_key` that overrides it first, then the limits they
 * apply to, then the three fields the schema marks required — which is what
 * `CommonForm`'s grouping already surfaced, kept so the rest reads as before.
 *
 * Listed by hand, which is the cost of the explicit order: a field a newer
 * Gateway marks `required` lands in Advanced rather than up here until it is
 * added to this list.
 */
const PRIMARY_FIELDS = [
  'limit_by',
  // Overrides the key `limit_by` computes, so it reads directly under it.
  'custom_key',
  'second',
  'minute',
  'hour',
  'day',
  'month',
  'year',
  'fault_tolerant',
  'hide_client_headers',
  'sync_rate',
]

const { i18n: { t }, i18nT } = useI18n()
const { getSchema } = useFormShared()

/**
 * Derived rather than listed, so a field a newer Gateway adds falls into the
 * Advanced section instead of disappearing from the form entirely.
 */
const advancedFields = computed(() => {
  const config = getSchema('config') as RecordFieldSchema | undefined

  return (config?.fields ?? [])
    .map(field => Object.keys(field)[0])
    .filter(name => !PRIMARY_FIELDS.includes(name))
})
</script>

<style lang="scss" scoped>
.ff-advanced-fields-container {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-heading) {
    margin: 0;
  }
}
</style>
