<template>
  <div>
    <router-link
      v-if="item.to"
      class="navigation-link"
      :to="item.to"
    >
      {{ item.value || t('baseConfigCard.commonFields.link') }}
    </router-link>
    <KButton
      v-else
      appearance="tertiary"
      class="navigation-button"
      @click="$emit('navigation-click', item)"
    >
      {{ item.value || t('baseConfigCard.commonFields.link') }}
    </KButton>
    <KSkeleton
      v-if="item.subtitleLoading"
      data-testid="navigation-subtitle-loader"
      type="spinner"
    />
    <div
      v-else-if="item.subtitle"
      class="navigation-subtitle"
    >
      {{ item.subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { RecordItem } from '../../types'
import composables from '../../composables'

defineEmits<{
  (e: 'navigation-click', record: RecordItem): void
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

.navigation-link {
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  font-size: 14px;
  font-weight: 400;
  text-decoration: underline;
}

.navigation-subtitle {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: 12px;
  font-weight: 400;
}
</style>
