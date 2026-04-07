<template>
  <div
    class="gradient-badge"
    :class="{ inverse }"
  >
    <div
      :class="['gradient-badge-content', { large }]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
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
</script>

<style lang="scss" scoped>
.gradient-badge {
  background: linear-gradient(90deg, var(--kui-color-background-inverse, $kui-color-background-inverse) 2.68%, rgba(0, 9, 51, 0.9) 100%) padding-box,
    linear-gradient(219.69deg, var(--kui-color-background-success-weak, $kui-color-background-success-weak) 0%, var(--kui-color-background-primary, $kui-color-background-primary) 74.54%) border-box;
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-transparent, $kui-color-border-transparent);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);

  .gradient-badge-content {
    background: linear-gradient(219.69deg, rgba(0, 214, 164, 0.2) 7.34%, rgba(0, 68, 244, 0.2) 83.28%);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text-inverse, $kui-color-text-inverse);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    padding: var(--kui-space-10, $kui-space-10) var(--kui-space-20, $kui-space-20);
    position: relative;

    &.large {
      padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    }
  }

  &.inverse {
    background: linear-gradient(221.99deg, #00E3C0 26.67%, #1257CA 128%);
    border: none;

    .gradient-badge-content {
      background: none;
      color: var(--kui-color-text, $kui-color-text);
      // stylelint-disable-next-line @kong/design-tokens/use-proper-token
      padding: calc(var(--kui-space-10, $kui-space-10) + var(--kui-border-width-10, $kui-border-width-10)) calc(var(--kui-space-20, $kui-space-20) + var(--kui-border-width-10, $kui-border-width-10)); // add border width to padding to keep size the same

      &.large {
        // stylelint-disable-next-line @kong/design-tokens/use-proper-token
        padding: calc(var(--kui-space-20, $kui-space-20) + var(--kui-border-width-10, $kui-border-width-10)) calc(var(--kui-space-40, $kui-space-40) + var(--kui-border-width-10, $kui-border-width-10)); // add border width to padding to keep size the same
      }
    }
  }
}
</style>
