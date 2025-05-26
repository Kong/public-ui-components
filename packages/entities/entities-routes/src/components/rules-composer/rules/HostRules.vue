<template>
  <div class="routing-rule-container">
    <KLabel
      :info="t('form.fields.hosts.tooltip')"
      :tooltip-attributes="{ maxWidth: '320' }"
    >
      {{ configType === 'basic' ? t('form.fields.hosts.label_singular') : t('form.fields.hosts.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in (configType === 'basic' ? hosts.slice(0, 1) : hosts)"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="hosts[index]"
          :data-testid="`route-form-hosts-input-${index + 1}`"
          :placeholder="t('form.fields.hosts.placeholder')"
        />
        <RuleControlsRemove
          :disabled="hosts.length === 1"
          :routing-rules-entity="RoutingRulesEntities.HOSTS"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
    <RuleControlsAdd
      :routing-rules-entity="RoutingRulesEntities.HOSTS"
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

const hosts = defineModel<string[]>({ required: true })

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
