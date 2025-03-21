<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel>
      {{ t('form.fields.methods.label') }}
    </KLabel>
    <div class="routing-rule-input">
      <div class="methods-input-container">
        <div
          v-for="method in Object.keys(methods)"
          :key="method"
          class="methods-input"
        >
          <KInputSwitch
            v-model="methods[method]"
            :data-testid="`${method.toLowerCase()}-method-toggle`"
          />
          <KBadge
            :appearance="Object.values(BadgeMethodAppearances).includes(method.toLowerCase() as BadgeMethodAppearance) ? method.toLowerCase() as BadgeMethodAppearance : 'custom'"
          >
            {{ method.toLowerCase() }}
          </KBadge>
        </div>
      </div>
      <KButton
        appearance="tertiary"
        class="remove-button"
        data-testid="remove-methods"
        icon
        @click="emit('remove')"
      >
        <TrashIcon :color="KUI_COLOR_TEXT_DANGER" />
      </KButton>
    </div>

    <!-- custom methods -->
    <div
      v-if="methods.CUSTOM"
      class="routing-rule-container"
    >
      <KLabel :info="t('form.fields.methods.custom.tooltip')">
        {{ t('form.fields.methods.custom.label') }}
      </KLabel>
      <TransitionGroup name="appear">
        <div
          v-for="_, index in customMethods"
          :key="index"
          class="routing-rule-input"
        >
          <KInput
            v-model.trim="customMethods[index]"
            :data-testid="`route-form-custom-method-input-${index + 1}`"
            :placeholder="t('form.fields.methods.custom.placeholder')"
          />
          <RuleControls
            :is-add-disabled="index !== customMethods.length - 1"
            :routing-rules-entity="RoutingRulesEntities.CUSTOM_METHOD"
            @add="customMethods.push('')"
            @remove="handleRemoveCustomMethod(index)"
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_DANGER } from '@kong/design-tokens'
import { TrashIcon } from '@kong/icons'
import type { BadgeMethodAppearance } from '@kong/kongponents'
import { BadgeMethodAppearances } from '@kong/kongponents'
import composables from '../../../composables'
import type { MethodsFields } from '../../../types'
import { RoutingRulesEntities } from '../../../types'
import RuleControls from './RuleControls.vue'

const { i18n: { t } } = composables.useI18n()

const methods = defineModel<MethodsFields>('methods', { required: true })
const customMethods = defineModel<string[]>('customMethods', { required: true })

const emit = defineEmits<{
  remove: []
}>()

const handleRemoveCustomMethod = (index: number) => {
  if (customMethods.value.length === 1) {
    customMethods.value[0] = ''
  } else {
    customMethods.value.splice(index, 1)
  }
}
</script>

<style lang="scss" scoped>
@use "../../../styles/mixins" as *;

.routing-rule {
  @include routing-rule;
}
</style>
