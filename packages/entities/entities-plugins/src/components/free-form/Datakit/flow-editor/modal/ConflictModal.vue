<template>
  <KModal
    :action-button-text="t('plugins.free-form.datakit.flow_editor.confirm.proceed')"
    close-on-backdrop-click
    max-width="660px"
    :title="title ?? t('plugins.free-form.datakit.flow_editor.confirm.title')"
    :visible="visible"
    :z-index="9999"
    @cancel="handleModalClose"
    @proceed="handleModalProceed"
  >
    <div class="dk-confirm-modal-body">
      <p>{{ message }}</p>
      <p>{{ t('plugins.free-form.datakit.flow_editor.confirm.message.confirm') }}</p>

      <div class="connections">
        <div
          v-for="[source, target] in addedConnections ?? []"
          :key="`${source}-${target}`"
          class="connection"
        >
          <AddIcon :color="KUI_COLOR_BACKGROUND_SUCCESS" />
          {{ source }} → {{ target }}
        </div>
        <div
          v-for="[source, target] in removedConnections ?? []"
          :key="`${source}-${target}`"
          class="connection"
        >
          <RemoveIcon :color="KUI_COLOR_TEXT_DANGER" />
          {{ source }} → {{ target }}
        </div>
      </div>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import useI18n from '../../../../../composables/useI18n'
import { ref } from 'vue'
import { AddIcon, RemoveIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_DANGER, KUI_COLOR_BACKGROUND_SUCCESS } from '@kong/design-tokens'

export type ConnectionString = [string, string]

export type OpenConfirm = (
  msg: string,
  added?: ConnectionString[],
  removed?: ConnectionString[],
) => Promise<boolean>

type ConfirmModalProps = {
  title?: string
  message?: string
  addedConnections?: ConnectionString[]
  removedConnections?: ConnectionString[]
}

const { i18n: { t } } = useI18n()

const {
  message: propMessage,
  addedConnections: propAddedConnections,
  removedConnections: propRemovedConnections,
} = defineProps<ConfirmModalProps>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const visible = ref(false)
const message = ref(propMessage)
const addedConnections = ref<ConnectionString[]>(propAddedConnections ?? [])
const removedConnections = ref<ConnectionString[]>(propRemovedConnections ?? [])
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

async function open(
  msg: string,
  added?: ConnectionString[],
  removed?: ConnectionString[],
) {
  message.value = msg
  addedConnections.value = added ?? []
  removedConnections.value = removed ?? []
  visible.value = true
  return await new Promise<boolean>((resolve) => {
    resolveFn = resolve
  })
}

defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
.dk-confirm-modal-body {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;

  .connections {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
  }

  .connection {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
  }
}

</style>
