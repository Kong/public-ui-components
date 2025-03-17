<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel :info="t('form.fields.headers.tooltip')">
      {{ t('form.fields.headers.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in headers"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="headers[index].header"
          :data-testid="`route-form-headers-name-input-${index + 1}`"
          :placeholder="t('form.fields.headers.name.placeholder')"
        />
        <KInput
          v-model.trim="headers[index].values"
          :data-testid="`route-form-headers-values-input-${index + 1}`"
          :placeholder="t('form.fields.headers.values.placeholder')"
        />
        <RuleControls
          :is-add-disabled="index !== headers.length - 1"
          :routing-rules-entity="RoutingRulesEntities.HEADERS"
          @add="emit('add')"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import composables from '../../../composables'
import type { HeaderFields } from '../../../types'
import { RoutingRulesEntities } from '../../../types'
import RuleControls from './RuleControls.vue'

const { i18n: { t } } = composables.useI18n()

const headers = defineModel<HeaderFields[]>({ required: true })

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
