<template>
  <div
    class="kong-ui-entity-form-block"
    :class="{
      'stepped': step !== undefined || slots.step,
    }"
  >
    <header class="header">
      <div
        v-if="step !== undefined || slots.step"
        class="step"
        data-testid="form-block-step"
      >
        <slot name="step">
          {{ step }}
        </slot>
      </div>
      <div class="header-content">
        <h2
          class="header-title"
          data-testid="header-title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </h2>
        <div
          v-if="description || slots.description"
          class="header-description"
          data-testid="header-description"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </div>
      </div>
      <div
        v-if="slots.extra"
        class="header-extra"
        data-testid="header-extra"
      >
        <slot name="extra" />
      </div>
    </header>
    <div
      class="content"
      data-testid="form-block-content"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const { step = undefined, title = '', description = '' } = defineProps<{
  step?: number
  title?: string
  description?: string
}>()

const slots = defineSlots<{
  default?: () => any
  step?: () => any
  title?: () => any
  description?: () => any
  extra?: () => any
}>()
</script>

<style lang="scss" scoped>
.kong-ui-entity-form-block {
  .header {
    align-items: flex-start;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
  }

  .step {
    align-items: center;
    background: var(--kui-color-background, $kui-color-background);
    border: 1px solid var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
    border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
    display: flex;
    flex: 0 0 auto;
    height: 32px;
    justify-content: center;
    padding: var(--kui-space-20, $kui-space-20);
    width: 32px;
  }

  .header-content {
    align-items: flex-start;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);
    padding-top: var(--kui-space-20, $kui-space-20);
  }

  .header-title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-50, $kui-font-size-50);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    margin: 0;
  }

  .header-description {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin: 0;
  }

  .header-extra {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    gap: var(--kui-space-40, $kui-space-40);
    justify-content: flex-end;
  }

  .content {
    background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
    margin-top: var(--kui-space-70, $kui-space-70);
    padding: var(--kui-space-70, $kui-space-70) var(--kui-space-80, $kui-space-80);
  }

  &.stepped {
    .content {
      margin-left: var(--kui-space-60, $kui-space-60);
    }
  }
}
</style>
