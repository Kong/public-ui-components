<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel :info="t('form.fields.hosts.tooltip')">
      {{ t('form.fields.hosts.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in hosts"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="hosts[index]"
          :data-testid="`route-form-hosts-input-${index + 1}`"
          :placeholder="t('form.fields.hosts.placeholder')"
        />
        <RuleControls
          :is-add-disabled="index !== hosts.length - 1"
          :routing-rules-entity="RoutingRulesEntities.HOSTS"
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

const hosts = defineModel<string[]>({ required: true })

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
