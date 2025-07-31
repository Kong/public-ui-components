<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    ref="root"
    class="dk-output-value-field"
  >
    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.label') }}
    </KLabel>

    <KCard
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="dk-output-value-field-entry"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <template #actions>
        <KButton
          appearance="none"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="removeEntry(entry.id)"
        >
          <CloseIcon />
        </KButton>
      </template>
      <KInput
        :id="`ff-kv-entry-key-${field.path.value}.${index}`"
        v-model.trim="entry.key"
        class="ff-kv-field-entry-key"
        :data-key-input="index"
        :data-testid="`ff-key-${field.path.value}.${index}`"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value_name')"
      />
      <KInput
        v-model.trim="entry.value"
        class="ff-kv-field-entry-value"
        :data-testid="`ff-value-${field.path.value}.${index}`"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value')"
      />
    </KCard>

    <KButton
      appearance="tertiary"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      @click="handleAddClick"
    >
      <AddIcon />
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.add_button') }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
// todo(zehao): format user inputs to json before update store, depend on the lazy input sync mode
import { useTemplateRef, nextTick } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import useI18n from '@/composables/useI18n'
import { useKeyValueField } from '@freeform/headless/useKeyValueField'
import type {
  KeyValueFieldProps,
  KeyValueFieldEmits,
} from '@freeform/headless/useKeyValueField'

const props = defineProps<KeyValueFieldProps>()
const emit = defineEmits<KeyValueFieldEmits>()

const {
  entries,
  addEntry,
  removeEntry,
  field,
} = useKeyValueField(props, emit)

const { i18n } = useI18n()
const root = useTemplateRef('root')

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddClick() {
  addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)
}

</script>

<style lang="scss" scoped>
.dk-output-value-field {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;

  &-entry {
    position: relative;
    width: 100%;

    :deep(.card-header) {
      position: absolute;
      right: 8px;
      top: 8px;
    }

    :deep(.card-content) {
      display: flex;
      flex-direction: column;
      gap: $kui-space-40;
    }
  }
}
</style>
