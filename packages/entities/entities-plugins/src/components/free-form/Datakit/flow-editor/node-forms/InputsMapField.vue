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
    class="dk-inputs-map-field"
  >
    <div
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="dk-inputs-map-field-entry dk-inputs-map-field-indent"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <KLabel :for="`ff-kv-entry-key-${field.path.value}.${index}`">
        {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label') }}
      </KLabel>
      <div class="dk-inputs-map-field-entry-body">
        <div class="dk-inputs-map-field-entry-content">
          <KInput
            :id="`ff-kv-entry-key-${field.path.value}.${index}`"
            v-model.trim="entry.key"
            class="ff-kv-field-entry-key"
            :data-key-input="index"
            :data-testid="`ff-key-${field.path.value}.${index}`"
            :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input_name.placeholder')"
          />
          <KSelect
            v-model="entry.value"
            class="ff-kv-field-entry-value"
            :data-testid="`ff-value-${field.path.value}.${index}`"
            :items="[]"
            :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
          />
        </div>
        <KButton
          appearance="none"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="removeEntry(entry.id)"
        >
          <CloseIcon />
        </KButton>
      </div>
    </div>

    <div class="dk-inputs-map-field-indent">
      <KButton
        appearance="tertiary"
        :data-testid="`ff-kv-add-btn-${field.path.value}`"
        @click="handleAddClick"
      >
        <AddIcon />
        {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.add_button') }}
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
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
@use '../styles/tree-indent' as mixins;

.dk-inputs-map-field {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;

  &-entry {
    width: 100%;

    &-body {
      align-items: flex-start;
      display: flex;
    }

    &-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: $kui-space-40;
    }
  }

  &-indent {
    @include mixins.tree-indent;
  }
}
</style>
