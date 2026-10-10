<template>
  <div class="kong-ui-app-page-header">
    <div class="page-header-title-section">
      <div class="page-header-title-wrapper">
        <h2
          class="page-header-title"
          data-testid="page-header-title"
          :title="title"
        >
          {{ title }}
        </h2>
        <div
          v-if="$slots['title-after']"
          class="page-header-title-after"
          data-testid="page-header-title-after"
        >
          <slot name="title-after" />
        </div>
      </div>

      <div
        v-if="$slots.actions"
        class="page-header-actions"
        data-testid="page-header-actions"
      >
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="$slots.below"
      class="page-header-section-below"
      data-testid="page-header-section-below"
    >
      <slot name="below" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '', // Provide a fallback string to prevent the component unmounting from throwing an error
  },
})
</script>

<style lang="scss" scoped>
.kong-ui-app-page-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: var(--kui-space-50, $kui-space-50);
  min-height: 32px;

  .page-header-title-section {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--kui-space-80, $kui-space-80);
    justify-content: space-between;

    .page-header-title-wrapper {
      align-items: baseline;
      display: flex;
      min-width: 0; /** this style is needed for truncation to work correctly with flex */

      .page-header-title-after {
        align-self: center;
        display: inline-flex;
        margin-left: var(--kui-space-60, $kui-space-60);
      }

      .page-header-title {
        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-40, $kui-font-size-40);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        line-height: var(--kui-line-height-30, $kui-line-height-30);
        margin: var(--kui-space-0, $kui-space-0);
        /** truncation */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .page-header-section-below {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-top: var(--kui-space-40, $kui-space-40);
    width: 100%;
  }

  @media (min-width: $kui-breakpoint-mobile) {
    .page-header-title-section {
      flex-wrap: nowrap;
    }

    .page-header-section-below {
      margin-top: unset;
    }
  }
}
</style>
