<template>
  <div class="jq-field">
    <StringField
      autosize
      :error="error"
      :error-message="errorMessage"
      :label="label"
      :label-attributes="{}"
      :model-value="modelValue"
      multiline
      :name="name"
      resizable
      @blur="handleBlur"
      @update:model-value="handleUpdate"
    >
      <template #help>
        <div class="jq-field-help">
          <i18nT keypath="plugins.free-form.datakit.flow_editor.node_properties.jq.help">
            <template #link>
              <KExternalLink
                hide-icon
                :href="externalLinks.jqlang"
              >
                {{ externalLinks.jqlang }}
              </KExternalLink>
            </template>
          </i18nT>
        </div>
      </template>
    </StringField>

    <!-- Floating JQ Playground Button -->
    <KButton
      appearance="tertiary"
      class="jq-playground-button"
      size="small"
      @click="openJqPlayground"
    >
      <RocketIcon />
      JQ Playground
    </KButton>

    <!-- JQ Playground Modal -->
    <JqPlaygroundModal
      v-model:visible="isPlaygroundVisible"
      :initial-jq-script="modelValue"
      @update-jq-script="updateJqScript"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StringField from '../../../shared/StringField.vue'
import JqPlaygroundModal from './JqPlaygroundModal.vue'
import useI18n from '../../../../../composables/useI18n'
import externalLinks from '../../../../../external-links'
import { RocketIcon } from '@kong/icons'

interface Props {
  modelValue: string
  name: string
  label?: string
  error?: boolean
  errorMessage?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}

defineProps<Props>()

const emit = defineEmits<Emits>()

const { i18nT } = useI18n()

// JQ Playground Modal state
const isPlaygroundVisible = ref(false)

function openJqPlayground() {
  isPlaygroundVisible.value = true
}

function handleUpdate(value: string | null) {
  emit('update:modelValue', value || '')
}

function handleBlur() {
  emit('blur')
}

function updateJqScript(script: string) {
  emit('update:modelValue', script)
}
</script>

<style lang="scss" scoped>
.jq-field {
  position: relative;

  .jq-field-help {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-40;
    justify-content: space-between;
  }

  .jq-playground-button {
    opacity: 0;
    position: absolute;
    right: 8px;
    top: 0px;
    transition: opacity 0.2s ease-in-out;
    z-index: 10;
  }

  &:hover .jq-playground-button {
    opacity: 1;
  }
}
</style>
