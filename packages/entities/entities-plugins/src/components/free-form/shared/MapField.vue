<template>
  <div>
    <h3>{{ fieldAttrs.label }}</h3>

    <div
      v-for="([keyId, name]) in keys"
      :key="keyId"
      class="item"
    >
      <div>
        <input
          placeholder="Key"
          :value="name"
          @input="(e: any) => updateKey(keyId, e.target.value)"
        >

        <Field :name="keyId" />
      </div>
      <button
        type="button"
        @click="removeKey(keyId)"
      >
        X
      </button>
    </div>

    <button
      type="button"
      @click="addKey"
    >
      + Add {{ fieldAttrs.label }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { toRef } from 'vue'
import { useField, useFieldAttrs } from './composables'
import type { BaseFieldProps } from './types'
import { useMapField } from './headless/useMapField'
import Field from './Field.vue'

interface MapFieldProps extends BaseFieldProps {
}

const props = defineProps<MapFieldProps>()

const { value: fieldValue, ...field } = useField(toRef(props, 'name'))

const fieldAttrs = useFieldAttrs(field.path!, props)

const {
  keys,
  updateKey,
  addKey,
  removeKey,
} = useMapField(toRef(props, 'name'))
</script>

<style scoped lang="scss">
.item {
  align-items: center;
  border: 1px solid #ccc;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: $kui-space-40;
}
</style>
