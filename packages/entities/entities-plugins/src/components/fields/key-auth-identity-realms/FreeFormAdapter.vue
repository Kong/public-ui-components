<template>
  <div data-testid="ff-identity-realms-field">
    <KLabel
      class="ff-array-field-label"
      v-bind="fieldAttrs"
      :data-testid="`ff-label-${path}`"
      :tooltip-attributes="fieldAttrs.labelAttributes.tooltipAttributes"
    >
      {{ fieldAttrs.label }}
      <template
        v-if="fieldAttrs.labelAttributes?.info"
        #tooltip
      >
        <slot name="tooltip">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="fieldAttrs.labelAttributes.info" />
        </slot>
      </template>
    </KLabel>
    <Base v-model="value" />
  </div>
</template>

<script lang="ts" setup>
import { toRef } from 'vue'
import { useField, useFieldAttrs } from '../../free-form/shared/composables'
import Base from './Base.vue'

import type { IdentityRealmItem } from './types'
import type { LabelAttributes } from '@kong/kongponents'
import type { ResetLabelPathRule } from '../../free-form/shared/types'

const props = defineProps<{
  name: string
  label?: string
  labelAttributes?: LabelAttributes
  required?: boolean
  placeholder?: string
  resetLabelPath?: ResetLabelPathRule
}>()

const { error, value, path } = useField<IdentityRealmItem[]>(toRef(props, 'name'))

if (error) {
  throw error
}

const fieldAttrs = useFieldAttrs(toRef(props, 'name'), props)
</script>
