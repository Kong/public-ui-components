<template>
  <div class="routing-rule-container">
    <KLabel
      :tooltip-attributes="{ maxWidth: '320' }"
    >
      <template #tooltip>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="t('form.fields.headers.tooltip')" />
      </template>
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
        <RuleControlsRemove
          :disabled="headers.length === 1"
          :routing-rules-entity="RoutingRulesEntities.HEADERS"
          @remove="emit('remove', index)"
        />
      </div>
    </TransitionGroup>
    <RuleControlsAdd
      :routing-rules-entity="RoutingRulesEntities.HEADERS"
      @add="emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
import composables from '../../../composables'
import type { HeaderFields } from '../../../types'
import { RoutingRulesEntities } from '../../../types'
import RuleControlsAdd from './RuleControlsAdd.vue'
import RuleControlsRemove from './RuleControlsRemove.vue'

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
