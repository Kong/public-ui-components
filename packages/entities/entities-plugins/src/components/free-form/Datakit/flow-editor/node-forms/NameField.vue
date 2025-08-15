<template>
  <KInput
    v-model:model-value="nameValue"
    data-1p-ignore
    :error="!!errorMessage"
    :error-message="errorMessage"
    :label="t('plugins.free-form.datakit.flow_editor.node_properties.name')"
    required
    @change="handleNameChange"
    @focus="handleBeforeNameChange"
  />
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watch } from 'vue'
import useI18n from '../../../../../composables/useI18n'
import type { ValidatorFn } from '../composables/validation'

const props = defineProps<{
  name: string
  validate: ValidatorFn<string>
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

const { i18n: { t } } = useI18n()

const nameValue = ref(props.name)
const errorMessage = computed(() => {
  const validationResult = props.validate(nameValue.value.trim())
  return validationResult === undefined ? '' : validationResult
})
let lastValidName = nameValue.value.trim()

function handleNameChange() {
  if (errorMessage.value) {
    nameValue.value = lastValidName
    return
  }
  emit('update', nameValue.value.trim())
}

function handleBeforeNameChange() {
  lastValidName = nameValue.value.trim()
}

watch(() => props.name, (newName) => {
  if (newName !== nameValue.value) {
    nameValue.value = newName
  }
})

</script>
