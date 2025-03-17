<template>
  <div class="routing-rule-container">
    <KLabel>{{ t('form.fields.paths.label') }}</KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in paths"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="paths[index]"
          :data-testid="`route-form-paths-input-${index + 1}`"
          :placeholder="t('form.fields.paths.placeholder')"
        />
        <RuleControls
          :is-add-disabled="index !== paths.length - 1"
          :routing-rules-entity="RoutingRulesEntities.PATHS"
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

const paths = defineModel<string[]>({ required: true })

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
