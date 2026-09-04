<template>
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

<script setup lang="ts">
import { KExternalLink } from '@kong/kongponents'
import ExpressionField from '../../shared/ExpressionField.vue'
import externalLinks from '../../../../external-links'
import useI18n from '../../../../composables/useI18n'

import type { BaseFieldProps } from '../../shared/types'

/**
 * `custom_key` on rate-limiting and rate-limiting-advanced: the counter key,
 * which is expressible like the limits but overrides the key rather than a
 * limit, so its expression reads differently — its own example and its own help
 * text instead of the shared editor's generic wording.
 *
 * Registered through `fieldRenderers`, which is how a plugin customizes one
 * field. A registered renderer owns the whole field, expression included, so
 * this renders `ExpressionField` rather than just the value input.
 */
defineProps<BaseFieldProps>()

const { i18n: { t }, i18nT } = useI18n()
</script>
