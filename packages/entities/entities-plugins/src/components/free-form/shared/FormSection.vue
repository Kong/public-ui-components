<template>
  <div class="ff-form-section">
    <header class="header">
      <div
        v-if="step != null"
        class="step"
      >
        {{ step }}
      </div>
      <div class="header-content">
        <h2 class="header-title">
          <slot name="title">
            {{ title }}
          </slot>
        </h2>
        <div class="header-description">
          <slot name="description">
            {{ description }}
          </slot>
        </div>
      </div>
    </header>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  step?: number
  title?: string
  description?: string
}>()

defineSlots<{
  default?: () => any
  title?: () => any
  description?: () => any
}>()
</script>

<style lang="scss" scoped>
.ff-form-section {
  .header {
    display: flex;
    gap: $kui-space-40;
  }

  .step {
    align-items: center;
    background: $kui-color-background;
    border: 1px solid $kui-color-border-neutral-weak;
    border-radius: $kui-border-radius-round;
    display: flex;
    height: 32px;
    justify-content: center;
    padding: $kui-space-20;
    width: 32px;
  }

  .header-content {
    align-items: flex-start;
    display: flex;
    flex: 1 0 0;
    flex-direction: column;
    gap: $kui-space-40;
    padding-top: $kui-space-20;
  }

  .header-title {
    color: $kui-color-text;
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-40;
    margin: 0;
  }

  .header-description {
    color: $kui-color-text-neutral-strong;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-30;
    margin: 0;
  }

  .content {
    background: $kui-color-background-neutral-weakest;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-30;
    display: flex;
    flex-direction: column;
    gap: $kui-space-70;
    margin-left: $kui-space-60;
    margin-top: $kui-space-70;
    padding: $kui-space-70 $kui-space-80;
  }
}
</style>
