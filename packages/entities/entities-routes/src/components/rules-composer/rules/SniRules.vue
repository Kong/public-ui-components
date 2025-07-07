<template>
  <div class="routing-rule-container">
    <KLabel
      :tooltip-attributes="{ maxWidth: '320' }"
    >
      <template #tooltip>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="t('form.fields.snis.tooltip')" />
      </template>
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
        <RuleControlsRemove
          :disabled="snis.length === 1"
          :routing-rules-entity="RoutingRulesEntities.SNIS"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
    <RuleControlsAdd
      :routing-rules-entity="RoutingRulesEntities.SNIS"
      @add="emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
import composables from '../../../composables'
import { RoutingRulesEntities } from '../../../types'
import RuleControlsAdd from './RuleControlsAdd.vue'
import RuleControlsRemove from './RuleControlsRemove.vue'

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
