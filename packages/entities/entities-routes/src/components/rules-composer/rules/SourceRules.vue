<template>
  <div class="routing-rule-container">
    <KLabel
      :tooltip-attributes="{ maxWidth: '320' }"
    >
      <template #tooltip>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="t('form.fields.sources.tooltip')" />
      </template>
      {{ t('form.fields.sources.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in sources"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="sources[index].ip"
          :data-testid="`route-form-sources-ip-input-${index + 1}`"
          :placeholder="t('form.fields.sources.ip.placeholder')"
        />
        <KInput
          v-model.number="sources[index].port"
          :data-testid="`route-form-sources-port-input-${index + 1}`"
          max="65535"
          min="0"
          :placeholder="t('form.fields.sources.port.placeholder')"
          type="number"
        />
        <RuleControlsRemove
          :disabled="sources.length === 1"
          :routing-rules-entity="RoutingRulesEntities.SOURCES"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
    <RuleControlsAdd
      :routing-rules-entity="RoutingRulesEntities.SOURCES"
      @add="emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
import composables from '../../../composables'
import type { Sources } from '../../../types'
import { RoutingRulesEntities } from '../../../types'
import RuleControlsAdd from './RuleControlsAdd.vue'
import RuleControlsRemove from './RuleControlsRemove.vue'

const { i18n: { t } } = composables.useI18n()

const sources = defineModel<Sources[]>({ required: true })

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
