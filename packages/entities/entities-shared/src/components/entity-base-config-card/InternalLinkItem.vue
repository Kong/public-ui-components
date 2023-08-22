<template>
  <div>
    <KButton
      appearance="btn-link"
      class="navigation-button"
      @click="$emit('navigation-click', item)"
    >
      {{ item.value || t('baseConfigCard.commonFields.link') }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { RecordItem } from '../../types'
import composables from '../../composables'

defineEmits<{
  (e: 'navigation-click', record: RecordItem): void,
}>()

defineProps({
  item: {
    type: Object as PropType<RecordItem>,
    required: true,
  },
})

const { i18n: { t } } = composables.useI18n()
</script>

<style scoped lang="scss">
:deep(.k-button).navigation-button {
  font-size: 14px;
  font-weight: 400;
}
</style>
