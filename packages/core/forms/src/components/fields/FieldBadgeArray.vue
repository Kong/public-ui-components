<template>
  <div class="badge-container">
    <KBadge
      v-for="(item, index) in badgeArray"
      :key="index"
      class="badge"
      :icon-before="false"
    >
      {{ item }}
      <template #icon>
        <CloseIcon
          role="button"
          tabindex="0"
          @click="removeElement(index)"
        />
      </template>
    </KBadge>
    <div class="new-badge-area">
      <div
        v-if="addMode"
        class="new-badge-selector"
      >
        <KSelect
          class="new-badge-select"
          clearable
          :items="items"
          :placeholder="schema.placeholder"
          @selected="newElement"
        />
        <TrashIcon
          color="#0044f4"
          @click="addMode = false"
        />
      </div>


      <AddIcon
        v-else
        class="add-badge-icon"
        color="#0044f4"
        @click="addMode = true"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, type PropType } from 'vue'
import { AddIcon ,CloseIcon, TrashIcon } from '@kong/icons'
import composables from '../../composables'
import type { SelectItem } from '@kong/kongponents/dist/types'
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  formOptions: {
    type: Object as PropType<Record<string, any>>,
    default: () => undefined,
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    default: () => undefined,
  },
  schema: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  vfg: {
    type: Object,
    required: true,
  },
  /**
   * TODO: stronger type
   * TODO: pass this down to KInput error and errorMessage
   */
  errors: {
    type: Array,
    default: () => [],
  },
  hint: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (event: 'modelUpdated', value: any, model: Record<string, any>): void
}>()

const modelRef = toRef(props, 'model')
const addMode = ref(false)

const { clearValidationErrors, updateModelValue, value: badgeArray } = composables.useAbstractFields({
  model: modelRef,
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

const newElement = (item: SelectItem) => {
  const val = item.value
  let newBadgeArray = badgeArray.value

  if (!newBadgeArray || !newBadgeArray.push) newBadgeArray = []

  newBadgeArray.push(val)

  updateModelValue(newBadgeArray, badgeArray.value)
  badgeArray.value = newBadgeArray

  // reset the mode
  addMode.value = false
}

const removeElement = (index: number) => {
  const newBadgeArray = badgeArray.value.filter((_: any, i: number) => i !== index)
  updateModelValue(newBadgeArray, badgeArray.value)
  badgeArray.value = newBadgeArray
}

defineExpose({
  clearValidationErrors,
})

const items = computed((): SelectItem[] => {
  if (props.schema.values) {
    return props.schema.values
  }

  if (props.schema.elements?.one_of?.length) {
    return props.schema.elements.one_of.map((value: string | number | boolean) => ({ label: String(value), value: String(value) } satisfies SelectItem))
  }

  return []
})
</script>

<style lang="scss" scoped>
.badge-container {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40;

  .badge {
    line-height: $kui-line-height-60;
  }
}

.new-badge-area {
  align-items: center;
  display: inline-flex;
  gap: $kui-space-40;

  .add-badge-icon {
    color: $kui-color-text-primary;
    cursor: pointer;
  }

  .new-badge-selector {
    align-items: center;
    display: flex;
    gap: $kui-space-20;

    .remove-icon {
      color: $kui-color-text-primary;
      cursor: pointer;
    }
  }

  .new-badge-select {
    :deep(.input-element-wrapper .before-content-wrapper:has(>.kui-icon:not(button):not([role=button]):only-child)) {
      cursor: pointer;
      pointer-events: auto;
    }
  }
}
</style>
