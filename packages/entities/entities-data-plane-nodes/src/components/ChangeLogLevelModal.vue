<template>
  <KModal
    max-width="640px"
    :title="title"
    :visible="visible"
    @cancel="closeAndReset"
  >
    <KSelect
      v-model="targetLogLevel"
      :items="items"
      :label="i18n.t('modal.select_log_level_title')"
    />

    <div class="explanation-wrapper">
      <KLabel>{{ i18n.t(`log_level.${targetLogLevel}`) }}</KLabel>
      <div>{{ explanation.explanation }}</div>
      <div
        v-if="explanation.warning"
        class="warning-message"
      >
        {{ explanation.warning }}
      </div>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../composables'
import { LogLevel, type DataPlaneNodeCommon } from '../types'

defineOptions({
  name: 'ChangeLogLevelModal',
})

const { i18n } = composables.useI18n()

const props = defineProps<{
  instanceList: Pick<DataPlaneNodeCommon, 'id' | 'hostname'>[]
}>()

const visible = defineModel<boolean>('visible')

const initialLogLevel = LogLevel.Info

const targetLogLevel = ref<LogLevel>(initialLogLevel)

const title = computed(() => {
  const summary = props.instanceList.length === 1
    ? `Node ${props.instanceList[0].hostname}`
    : `${props.instanceList.length} Nodes`
  return i18n.t('modal.change_log_level.title', { summary })
})

const items = composables.useLogLevelSelectItems({
  initialSelected: initialLogLevel,
})

const explanation = composables.useLogLevelExplanation(targetLogLevel)

const closeAndReset = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.explanation-wrapper {
  margin-top: $kui-space-70;

  :deep(.k-label) {
    margin-bottom: 0 !important;
  }

  .warning-message {
    color: $kui-color-text-danger;
  }
}
</style>
