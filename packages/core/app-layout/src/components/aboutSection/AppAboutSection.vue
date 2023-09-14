<template>
  <KCard class="kong-ui-app-about-section">
    <template
      v-if="title"
      #title
    >
      <span
        class="about-section-title"
        data-testid="about-section-title"
      >
        {{ title }}
      </span>
    </template>

    <template
      v-if="$slots.actions || created || modified"
      #actions
    >
      <div class="about-section-header-end">
        <div
          v-if="created || modified"
          class="about-section-timestamps"
          :class="{ 'has-actions': $slots.actions }"
        >
          <span
            v-if="created"
            class="about-section-timestamps-created"
            data-testid="about-section-timestamps-created"
          >{{ createdLabel }}: {{ created }}</span>
          <span
            v-if="created && displayModified"
            class="about-section-timestamps-arrow"
          >-></span>
          <span
            v-if="displayModified"
            class="about-section-timestamps-modified"
            data-testid="about-section-timestamps-modified"
          >{{ modifiedLabel }}: {{ modified }}</span>
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
        v-if="isLoading"
        data-testid="about-section-loading-skeleton"
      >
        <KSkeletonBox
          height="2"
          width="100"
        />
        <KSkeletonBox
          height="2"
          width="100"
        />
      </div>

      <div v-else>
        <p
          v-if="description"
          class="about-section-description"
          data-testid="about-section-description"
        >
          {{ description }}
        </p>

        <div
          v-if="$slots.default"
          class="about-section-content"
          data-testid="about-section-content"
        >
          <slot name="default" />
        </div>

        <hr
          v-if="$slots['divider-section']"
          data-testid="about-divider-section-separator"
        >

        <div
          v-if="$slots['divider-section']"
          class="about-divider-section"
          data-testid="about-divider-section"
        >
          <slot name="divider-section" />
        </div>
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
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
    default: 'Created',
  },
  modified: {
    type: String,
    default: '',
  },
  modifiedLabel: {
    type: String,
    default: 'Modified',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const displayModified = computed(() => {
  return !!props.modified && props.modified !== props.created
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

      @media (max-width: $kui-breakpoint-phablet) {
        flex-direction: column;
        margin-bottom: $kui-space-50;
      }

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
    margin-top: $kui-space-0;
  }

  .about-section-content {
    align-items: flex-start;
    align-self: stretch;
    color: $kui-color-text-neutral;
    column-gap: $kui-space-70;
    display: flex;
    flex-wrap: wrap;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-30;
    padding: $kui-space-0;
    row-gap: $kui-space-30;
  }

  .about-divider-section {
    color: $kui-color-text-neutral;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
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
// TODO: clean up these styles after KCard redesign - KHCP-8971
.kong-ui-app-about-section.kong-card.border {
  border-radius: $kui-border-radius-20;
  padding: $kui-space-70;

  .k-card-header {
    align-items: baseline;
    margin-bottom: $kui-space-0 !important;

    @media (max-width: $kui-breakpoint-phablet) {
      flex-direction: column;

      .k-card-actions {
        margin-left: unset;
      }
    }
  }
}
</style>
