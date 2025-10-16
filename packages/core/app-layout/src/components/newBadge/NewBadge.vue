<template>
  <div
    class="new-badge-wrapper"
    :class="{ inverse }"
  >
    <div
      :class="['new-badge', { large }]"
    >
      {{ t('new') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../../composables'

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

const { i18n: { t } } = useI18n()
</script>

<style lang="scss" scoped>
.new-badge-wrapper {
  background: linear-gradient(90deg, $kui-color-background-inverse 2.68%, rgba(0, 9, 51, 0.9) 100%) padding-box,
    linear-gradient(219.69deg, $kui-color-background-success-weak 0%, $kui-color-background-primary 74.54%) border-box;
  border: $kui-border-width-10 solid $kui-color-border-transparent;
  border-radius: $kui-border-radius-20;

  .new-badge {
    background: linear-gradient(219.69deg, rgba(0, 214, 164, 0.2) 7.34%, rgba(0, 68, 244, 0.2) 83.28%);
    border-radius: $kui-border-radius-20;
    color: $kui-color-text-inverse;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-20;
    padding: $kui-space-10 $kui-space-20;
    position: relative;

    &.large {
      padding: $kui-space-20 $kui-space-40;
    }
  }

  &.inverse {
    background: linear-gradient(221.99deg, #00E3C0 26.67%, #1257CA 128%);
    border: none;

    .new-badge {
      background: none;
      color: $kui-color-text;
      // stylelint-disable-next-line @kong/design-tokens/use-proper-token
      padding: calc($kui-space-10 + $kui-border-width-10) calc($kui-space-20 + $kui-border-width-10); // add border width to padding to keep size the same

      &.large {
        // stylelint-disable-next-line @kong/design-tokens/use-proper-token
        padding: calc($kui-space-20 + $kui-border-width-10) calc($kui-space-40 + $kui-border-width-10); // add border width to padding to keep size the same
      }
    }
  }
}
</style>
