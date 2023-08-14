<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel :info="t('form.fields.hosts.tooltip')">
      {{ t('form.fields.hosts.label') }}
    </KLabel>
    <TransitionGroup name="appear">
      <div
        v-for="_, index in fieldsValue"
        :key="index"
        class="routing-rule-input"
      >
        <KInput
          v-model.trim="fieldsValue[index]"
          :data-testid="`route-form-hosts-input-${index + 1}`"
          :placeholder="t('form.fields.hosts.placeholder')"
        />
        <RoutingRulesEntitiesControls
          :is-add-disabled="index !== fieldsValue.length - 1"
          :routing-rules-entity="RoutingRulesEntities.HOSTS"
          @add="$emit('add')"
          @remove="$emit('remove', index)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from 'vue'
import { RoutingRulesEntities } from '../types'
import composables from '../composables'
import RoutingRulesEntitiesControls from './RoutingRulesEntitiesControls.vue'

/** Local types, not exported
 * Same pattern used other fields components
 */
type FieldsValue = Array<string>

const props = defineProps({
  modelValue: {
    type: Array as PropType<FieldsValue>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'add'): void,
  (e: 'remove', index: number): void,
  (e: 'update:modelValue', value: FieldsValue): void,
}>()

const { i18n: { t } } = composables.useI18n()

const fieldsValue = ref<FieldsValue>([])

watch(props.modelValue, (value) => {
  fieldsValue.value = [...value]
}, { immediate: true, deep: true })

watch(fieldsValue, (value) => {
  emit('update:modelValue', value)
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '../styles/mixins';

.routing-rule {
  @include routing-rule;
}
</style>
