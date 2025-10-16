<template>
  <div class="new-badge-wrapper">
    <div
      :class="['new-badge', { large, inverse }]"
    >
      {{ t('newBadge.label') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'

defineProps({
  large: {
    type: Boolean,
    default: false,
  },
  inverse: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()
</script>

<style lang="scss" scoped>
.new-badge-wrapper {
  background: linear-gradient(90deg, $kui-color-background-inverse 2.68%, rgba(0, 9, 51, 0.9) 100%) padding-box,
    linear-gradient(219.69deg, $kui-color-background-success-weak 0%, $kui-color-background-primary 74.54%) border-box;
  border: $kui-border-width-10 solid transparent;
  border-radius: $kui-border-radius-20;

  .new-badge {
    border-radius: $kui-border-radius-20;
    color: $kui-color-text-inverse;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-20;
    padding: $kui-space-10 $kui-space-20;
    position: relative;

    &:not(.inverse) {
      background: linear-gradient(219.69deg, rgba(0, 214, 164, 0.2) 7.34%, rgba(0, 68, 244, 0.2) 83.28%);
    }

    &.large {
      padding: $kui-space-20 $kui-space-40;
    }
  }
}
</style>
