<template>
  <KCard class="kong-ui-app-about-section">
    <template
      v-if="title"
      #title
    >
      <div class="about-section-title">
        {{ title }}
      </div>
    </template>

    <template
      v-if="$slots.actions || created || modified"
      #actions
    >
      <!-- TODO: translation -->
      <div class="about-section-header-end">
        <div
          v-if="created || modified"
          class="about-section-timestamps"
          :class="{ 'has-actions': $slots.actions }"
        >
          <span
            v-if="created"
            class="about-section-timestamps-created"
          >{{ createdLabel || 'Created' }}: {{ created }}</span>
          <!-- TODO: use new icon instead of KIcon -->
          <span
            v-if="created && modified"
            class="about-section-timestamps-arrow"
          >-></span>
          <span
            v-if="modified"
            class="about-section-timestamps-modified"
          >{{ modifiedLabel || 'Modified' }}: {{ modified }}</span>
        </div>

        <div
          v-if="$slots.actions"
          class="about-section-actions"
          data-testid="about-section-actions"
        >
          <slot name="actions" />
        </div>
      </div>
    </template>

    <template #body>
      <div
        v-if="description"
        class="about-section-description"
      >
        {{ description }}
      </div>

      <div
        v-if="$slots.default"
        class="about-section-content"
      >
        <slot />
      </div>

      <hr v-if="$slots['divider-section']">

      <div
        v-if="$slots['divider-section']"
        class="about-divider-section"
      >
        <slot name="divider-section" />
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  created: {
    type: String,
    default: '',
  },
  createdLabel: {
    type: String,
    default: '',
  },
  modified: {
    type: String,
    default: '',
  },
  modifiedLabel: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.kong-ui-app-about-section {
  .about-section-title {
    color: $kui-color-text;
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-bold;
    letter-spacing: $kui-letter-spacing-minus-20;
    line-height: $kui-line-height-30;
  }

  .about-section-header-end {
    display: flex;
    .about-section-timestamps {
      align-self: center;
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
      line-height: $kui-line-height-20;

      &.has-actions {
        margin-right: $kui-space-60;
      }

      .about-section-timestamps-arrow {
        line-height: $kui-line-height-30;
        margin-left: $kui-space-40;
        margin-right: $kui-space-40;
      }
    }
  }

  .about-section-description {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-30;
    margin-bottom: $kui-space-70;
  }

  .about-section-content {
    align-items: flex-start;
    align-self: stretch;
    color: $kui-color-text-neutral;
    column-gap: $kui-space-70;
    display: flex;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-30;
    padding: $kui-space-0;
  }

  .about-divider-section {
    color: $kui-color-text-neutral;
    display: flex;
    flex-direction: column;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-30;
    row-gap: $kui-space-50;
  }

  :deep(hr),
  hr {
    background-color: $kui-color-border;
    border: none;
    height: 1px;
    margin: $kui-space-0;
    width: 100%;
  }

  hr {
    margin-bottom: $kui-space-50;
    margin-top: $kui-space-50;
  }
}
</style>

<style lang="scss">
.kong-ui-app-about-section.kong-card.border {
  border-radius: $kui-border-radius-20;
  padding: $kui-space-70;

  .k-card-header {
    align-items: baseline;
    margin-bottom: $kui-space-0 !important;
  }
}
</style>
