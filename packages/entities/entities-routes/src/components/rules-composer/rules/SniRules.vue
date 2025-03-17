<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel :info="t('form.fields.snis.tooltip')">
      {{ t('form.fields.snis.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in snis"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="snis[index]"
          :data-testid="`route-form-snis-input-${index + 1}`"
          :placeholder="t('form.fields.snis.placeholder')"
        />
        <RuleControls
          :is-add-disabled="index !== snis.length - 1"
          :routing-rules-entity="RoutingRulesEntities.SNIS"
          @add="emit('add')"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import composables from '../../../composables'
import { RoutingRulesEntities } from '../../../types'
import RuleControls from './RuleControls.vue'

const { i18n: { t } } = composables.useI18n()

const snis = defineModel<string[]>({ required: true })

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()
</script>

<style lang="scss" scoped>
@use "../../../styles/mixins" as *;

.routing-rule {
  @include routing-rule;
}
</style>
