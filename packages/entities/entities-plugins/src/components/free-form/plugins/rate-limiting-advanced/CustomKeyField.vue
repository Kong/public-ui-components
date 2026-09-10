<template>
  <StringField
    v-bind="props"
    :expression-editor="{ placeholder: t('sp.custom_key.expression_placeholder') }"
  >
    <template #expression-help>
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
  </StringField>
</template>

<script setup lang="ts">
import { KExternalLink } from '@kong/kongponents'
import StringField from '../../core/components/StringField.vue'
import externalLinks from '../../../../external-links'
import useI18n from '../../../../composables/useI18n'

import type { BaseFieldProps } from '../../core/types'

/**
 * `config.custom_key`: the counter key, expressible like the limits but
 * overriding the key rather than a limit, so its expression reads differently —
 * its own example and help text instead of the shared editor's generic wording.
 *
 * `StringField` with wording, so it is registered through `FieldRenderer`
 * like any other field component. rate-limiting has the same field and imports
 * this one rather than repeating it.
 */
const props = defineProps<BaseFieldProps>()

const { i18n: { t }, i18nT } = useI18n()
</script>
