<template>
  <div class="routing-rule-container">
    <KLabel
      :tooltip-attributes="{ maxWidth: '320' }"
    >
      <template #tooltip>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="t('form.fields.paths.tooltip')" />
      </template>
      {{ configType === 'basic' ? t('form.fields.paths.label_singular') : t('form.fields.paths.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in (configType === 'basic' ? paths.slice(0, 1) : paths)"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="paths[index]"
          :data-testid="`route-form-paths-input-${index + 1}`"
          :placeholder="t('form.fields.paths.placeholder')"
        />
        <RuleControlsRemove
          :disabled="paths.length === 1"
          :routing-rules-entity="RoutingRulesEntities.PATHS"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
    <RuleControlsAdd
      :routing-rules-entity="RoutingRulesEntities.PATHS"
      @add="emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import composables from '../../../composables'
import { RoutingRulesEntities } from '../../../types'
import RuleControlsAdd from './RuleControlsAdd.vue'
import RuleControlsRemove from './RuleControlsRemove.vue'

const { i18n: { t } } = composables.useI18n()

const paths = defineModel<string[]>({ required: true })

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const configType = inject('configType', 'basic')
</script>

<style lang="scss" scoped>
@use "../../../styles/mixins" as *;

.routing-rule {
  @include routing-rule;
}
</style>
