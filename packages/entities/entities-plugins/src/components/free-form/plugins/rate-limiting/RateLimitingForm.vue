<template>
  <DynamicLayout
    v-bind="props"
    :render-rules="renderRules"
    :schema="gatedSchema"
  >
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.custom_key'"
      >
        <CustomKeyField v-bind="slotProps" />
      </FieldRenderer>

      <!--
        The six windows are all limits, so they share the limit example. The
        shared editor ships no placeholder — without one it would fall back to
        the field's own default, which reads as a value rather than an
        expression — so whoever knows the field supplies it.
      -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => LIMIT_FIELDS.has(path)"
      >
        <NumberField
          v-bind="slotProps"
          :expression-editor="{ placeholder: t('sp.request_limits.expression_placeholder') }"
        />
      </FieldRenderer>
    </template>

    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import CustomKeyField from '../rate-limiting-advanced/CustomKeyField.vue'
import NumberField from '../../core/components/NumberField.vue'
import useI18n from '../../../../composables/useI18n'
import FieldRenderer from '../../core/components/FieldRenderer.vue'
import DynamicLayout from '../../layout/DynamicLayout.vue'
import { useExpressionMode } from '../_shared/use-expression-mode'

import type { PluginFormLayoutProps as Props } from '../../layout/provider'
import type { RenderRules } from '../../core/types'

const props = defineProps<Props>()

const { i18n: { t } } = useI18n()

/** The expressible windows, which all take the same kind of expression. */
const LIMIT_FIELDS = new Set([
  'config.second',
  'config.minute',
  'config.hour',
  'config.day',
  'config.month',
  'config.year',
])

// `second`..`year` and `custom_key` are expressible; gate them with the rest
// of the 3.16 features.
// `second`..`year` and `custom_key` are expressible; gate their expression
// editors with the rest of the 3.16 features, leaving the fields themselves.
const { gatedSchema } = useExpressionMode(() => props.schema)

// A custom component owns its own render rules, so these live here rather than
// in the plugin config.
const renderRules: RenderRules = {
  bundles: [
    ['config.policy', 'config.redis'],
  ],
  dependencies: {
    'config.redis': ['config.policy', 'redis'],
  },
}

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
