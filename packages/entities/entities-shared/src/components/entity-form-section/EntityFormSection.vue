<template>
  <fieldset
    class="kong-ui-entity-form-section"
    :class="{ 'has-divider': hasDivider }"
  >
    <div class="form-section-wrapper">
      <div
        v-if="!hideInfoHeader"
        class="form-section-info"
        :class="{ 'sticky': stickyInfoHeader }"
      >
        <h2
          v-if="title"
          class="form-section-title"
        >
          {{ title }}
        </h2>
        <div
          v-if="description || slots.description"
          class="form-section-description"
        >
          <slot
            name="description"
          >
            <p>
              {{ description }}
            </p>
          </slot>
        </div>
        <div
          v-if="slots.footer"
          class="form-section-footer"
        >
          <slot name="footer" />
        </div>
      </div>
      <div class="form-section-content">
        <slot />
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  hasDivider: {
    type: Boolean,
    default: false,
  },
  stickyInfoHeader: {
    type: Boolean,
    default: true,
  },
  hideInfoHeader: {
    type: Boolean,
    default: false,
  },
})

const slots = useSlots()
</script>

<style lang="scss" scoped>
fieldset {
  margin: 0;
  padding: 0;
}

.kong-ui-entity-form-section {
  border: 0;

  .form-section-wrapper {
    column-gap: $kui-space-60;
    display: flex;
    flex-direction: column;
    padding-bottom: $kui-space-130;
    row-gap: $kui-space-50;
    width: 100%;

    @media (min-width: $kui-breakpoint-tablet) {
      flex-direction: row;
    }

    .form-section-info {
      flex: 1;

      @media (min-width: $kui-breakpoint-tablet) {
        max-width: 350px;

        &.sticky {
          height: fit-content;
          margin-bottom: $kui-space-60;
          position: sticky;
          top: 16px;
        }
      }

      .form-section-title {
        margin-top: $kui-space-0;
        color: $kui-color-text;
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-bold;
        line-height: $kui-line-height-30;
        margin-bottom: $kui-space-40;
      }

      .form-section-description,
      .form-section-description p,
      .form-section-description :deep(p) {
        color: $kui-color-text;
        font-size: $kui-font-size-30;
        font-weight: 400;
        line-height: 20px;
        margin: 0;
      }

      .form-section-footer {
        margin-top: $kui-space-90;
      }
    }

    .form-section-content {
      flex: 1;

      &:deep(> *) {
        &:not(:first-child) {
          margin-top: $kui-space-80;
        }
      }
    }
  }

  &.has-divider {
    .form-section-wrapper {
      border-bottom: $kui-border-width-10 solid $kui-color-border;
    }
  }
}
</style>
