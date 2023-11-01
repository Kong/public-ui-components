<template>
  <div class="routing-rule-container">
    <hr>
    <KLabel>
      {{ t('form.fields.methods.label') }}
    </KLabel>
    <div class="routing-rule-input">
      <div class="methods-input">
        <KMethodBadge
          v-for="method in Object.keys(fieldsValue)"
          :key="method"
          v-model="fieldsValue[method]"
          :data-testid="`${method.toLowerCase()}-method-toggle`"
          is-toggle
          :label="MethodsArray.includes(method.toLowerCase() as Method) ? '' : method"
          :method="(MethodsArray.includes(method.toLowerCase() as Method) ? method.toLowerCase() as Method : 'custom')"
        />
      </div>
      <KButton
        appearance="tertiary"
        class="remove-button"
        data-testid="remove-methods"
        @click="$emit('remove')"
      >
        <template #icon>
          <KIcon icon="trash" />
        </template>
      </KButton>
    </div>

    <!-- custom methods -->
    <div
      v-if="fieldsValue.CUSTOM"
      class="routing-rule-container"
    >
      <KLabel :info="t('form.fields.methods.custom.tooltip')">
        {{ t('form.fields.methods.custom.label') }}
      </KLabel>
      <TransitionGroup name="appear">
        <div
          v-for="_, index in customMethodsValue"
          :key="index"
          class="routing-rule-input"
        >
          <KInput
            v-model.trim="customMethodsValue[index]"
            :data-testid="`route-form-custom-method-input-${index + 1}`"
            :placeholder="t('form.fields.methods.custom.placeholder')"
          />
          <RoutingRulesEntitiesControls
            :is-add-disabled="index !== customMethodsValue.length - 1"
            :routing-rules-entity="RoutingRulesEntities.CUSTOM_METHOD"
            @add="customMethodsValue.push('')"
            @remove="handleRemoveCustomMethod(index)"
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, watch } from 'vue'
import type { MethodsFields } from '../types'
import { RoutingRulesEntities } from '../types'
import composables from '../composables'
import RoutingRulesEntitiesControls from './RoutingRulesEntitiesControls.vue'
import type { Method } from '@kong/kongponents'
import { MethodsArray } from '@kong/kongponents'

/** Local types, not exported
 * Same pattern used other fields components
 */
type FieldsValue = MethodsFields

const props = defineProps({
  modelValue: {
    type: Object as PropType<FieldsValue>,
    required: true,
  },
  customMethods: {
    type: Array as PropType<Array<string>>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'add'): void,
  (e: 'remove'): void,
  (e: 'update:modelValue', value: FieldsValue): void,
  (e: 'update-custom-methods', value: Array<string>): void,
}>()

const { i18n: { t } } = composables.useI18n()

const fieldsValue = ref<FieldsValue>({})
const customMethodsValue = ref<Array<string>>([...props.customMethods])

const handleRemoveCustomMethod = (index: number) => {
  if (customMethodsValue.value.length === 1) {
    customMethodsValue.value[0] = ''
  } else {
    customMethodsValue.value.splice(index, 1)
  }
}

watch(props.modelValue, (value) => {
  fieldsValue.value = { ...value }
}, { immediate: true, deep: true })

watch(fieldsValue, (value) => {
  emit('update:modelValue', value)
}, { deep: true })

watch(customMethodsValue, (value) => {
  emit('update-custom-methods', value)
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '../styles/mixins';

.routing-rule {
  @include routing-rule;
}
</style>
