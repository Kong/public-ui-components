<template>
  <KSelect
    :items="selectItems"
    label="Property"
    :label-attributes="({
      maxWidth: '300px',
      placement: 'top',
      info: 'The property name to get/set'
    } as any)"
    required
    @change="handleSelectChange"
  >
    <template #item-template="{ item }">
      <div class="dk-kong-property-item">
        <div>
          <div>
            {{ item.label }}
          </div>
          <div class="property-type">
            {{ KONG_CLIENT_SUPPORTED_PROPERTIES[item.value].dataType }}
          </div>
        </div>
        <div class="property-badges">
          <KBadge
            v-if="KONG_CLIENT_SUPPORTED_PROPERTIES[item.value].readable"
            appearance="info"
          >
            {{ t('plugins.free-form.datakit.flow_editor.node_properties.property.get') }}
          </KBadge>
          <KBadge
            v-if="KONG_CLIENT_SUPPORTED_PROPERTIES[item.value].writable"
            appearance="warning"
          >
            {{ t('plugins.free-form.datakit.flow_editor.node_properties.property.set') }}
          </KBadge>
        </div>
      </div>
    </template>
  </KSelect>

  <KInput
    v-if="isCurrentPropertyHasKey"
    v-model="key"
    label="key"
    required
    @change="handleKeyChange"
  />
</template>

<script setup lang="ts">
import type { SelectItem } from '@kong/kongponents'
import useI18n from '../../../../../composables/useI18n'
import { useFormShared } from '../../../shared/composables'
import { computed, ref, watch } from 'vue'
import {
  extractKeyFromProperty,
  getPropertyWithoutKey,
  identifyPropertyHasKey,
  KONG_CLIENT_SUPPORTED_PROPERTIES,
  PROPERTY_KEY_PATTERN,
  PROPERTY_PREFIXES,
} from './property'

const { i18n: { t } } = useI18n()

const emit = defineEmits<{
  (e: 'update:model-value', value: string | null): void
}>()

const { formData } = useFormShared<{ property: string | null }>()

const lastPropertyValueWithoutKey = ref<string | null>(getPropertyWithoutKey(formData.property))

const isCurrentPropertyHasKey = computed(() => identifyPropertyHasKey(formData.property))

const key = ref<string | undefined>(extractKeyFromProperty(formData.property))

const selectItems = computed<Array<SelectItem<string>>>(() => {
  return Object.entries(KONG_CLIENT_SUPPORTED_PROPERTIES).map(([prop]) => {
    const selected = identifyPropertyHasKey(prop)
      ? formData.property?.startsWith(prop.replace(PROPERTY_KEY_PATTERN, ''))
      : formData.property === prop
    const label = selected
      ? (key.value ? prop.replace(PROPERTY_KEY_PATTERN, key.value) : prop)
      : prop

    return ({
      label,
      value: prop,
      selected,
    })
  })
})

function handleKeyChange(e: InputEvent) {
  const prefix = PROPERTY_PREFIXES.find(prefix => formData.property?.startsWith(prefix))

  if (!prefix) return

  const val = (e.target as HTMLInputElement).value
  formData.property = prefix + val
  emit('update:model-value', formData.property)
}

function handleSelectChange(item: SelectItem<string> | null) {
  // The onChange event will be triggered when the `items` changes,
  // we have to avoid updating the property if the value is the same.
  if (lastPropertyValueWithoutKey.value === getPropertyWithoutKey(item?.value)) {
    return
  }
  formData.property = item?.value || null
  lastPropertyValueWithoutKey.value = getPropertyWithoutKey(formData.property)
  emit('update:model-value', formData.property)
}

watch(() => formData.property, (newProperty) => {
  key.value = extractKeyFromProperty(newProperty)
  lastPropertyValueWithoutKey.value = getPropertyWithoutKey(newProperty)
})

</script>

<style lang="scss" scoped>
.dk-kong-property-item {
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;

  .property-badges {
    display: flex;
    gap: $kui-space-20;
  }

  .property-type {
    color: $kui-color-text-neutral
  }
}
</style>
