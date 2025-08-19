<template>
  <KModal
    action-button-text="OK"
    close-on-backdrop-click
    :title="title ?? 'Datakit'"
    :visible="visible"
    :z-index="9999"
    @cancel="handleModalClose"
    @proceed="handleModalProceed"
  >
    {{ message }}
  </KModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type ConfirmModalProps = {
  title?: string
  message?: string
}

const {
  title = 'Datakit', // todo: confirm with designer
  message: propMessage,
} = defineProps<ConfirmModalProps>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

const visible = ref(false)
const message = ref(propMessage)
let resolveFn: ((result: boolean) => void) | null = null

function handleModalClose() {
  visible.value = false
  emit('cancel')
  resolveFn?.(false)
}

function handleModalProceed() {
  visible.value = false
  emit('confirm')
  resolveFn?.(true)
}

async function open(msg: string) {
  message.value = msg
  visible.value = true
  return await new Promise<boolean>((resolve) => {
    resolveFn = resolve
  })
}

defineExpose({
  open,
})
</script>
