<template>
  <ExpressionField
    v-bind="props"
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

<script setup lang="ts">
import { KExternalLink } from '@kong/kongponents'
import ExpressionField from '../../shared/ExpressionField.vue'
import externalLinks from '../../../../external-links'
import useI18n from '../../../../composables/useI18n'

import type { BaseFieldProps } from '../../shared/types'

/**
 * `config.custom_key`: the counter key, expressible like the limits but
 * overriding the key rather than a limit, so its expression reads differently —
 * its own example and help text instead of the shared editor's generic wording.
 *
 * `ExpressionField` with wording, so it is registered through `FieldRenderer`
 * like any other field component. rate-limiting has the same field and imports
 * this one rather than repeating it.
 */
const props = defineProps<BaseFieldProps>()

const { i18n: { t }, i18nT } = useI18n()
</script>
