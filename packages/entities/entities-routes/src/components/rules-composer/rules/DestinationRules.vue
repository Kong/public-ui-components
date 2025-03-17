<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel :info="t('form.fields.destinations.tooltip')">
      {{ t('form.fields.destinations.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in destinations"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="destinations[index].ip"
          :data-testid="`route-form-destinations-ip-input-${index + 1}`"
          :placeholder="t('form.fields.destinations.ip.placeholder')"
        />
        <KInput
          v-model.number="destinations[index].port"
          :data-testid="`route-form-destinations-port-input-${index + 1}`"
          max="65535"
          min="0"
          :placeholder="t('form.fields.destinations.port.placeholder')"
          type="number"
        />
        <RuleControls
          :is-add-disabled="index !== destinations.length - 1"
          :routing-rules-entity="RoutingRulesEntities.DESTINATIONS"
          @add="emit('add')"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import composables from '../../../composables'
import type { Destinations } from '../../../types'
import { RoutingRulesEntities } from '../../../types'
import RuleControls from './RuleControls.vue'

const { i18n: { t } } = composables.useI18n()

const destinations = defineModel<Destinations[]>({ required: true })

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
