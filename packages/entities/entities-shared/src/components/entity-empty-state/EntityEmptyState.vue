<template>
  <div class="kong-ui-public-entity-empty-state">
    <div
      v-if="$slots.icon"
      class="entity-empty-state-icon"
    >
      <slot name="icon" />
    </div>
    <div
      v-else
      class="entity-empty-state-image"
    >
      <slot name="image" />
    </div>
    <div class="entity-empty-state-content">
      <div
        v-if="title || $slots.title"
        class="entity-empty-state-title"
      >
        <div :title="title">
          {{ title }}
        </div>
        <span
          v-if="$slots['title-after']"
        >
          <slot
            name="title-after"
          />
        </span>
      </div>
      <div
        v-if="description || $slots.default"
        class="entity-empty-state-description"
      >
        <slot name="default">
          <p>
            {{ description }}
          </p>
        </slot>
      </div>
      <div
        v-if="pricing"
        class="entity-empty-state-pricing"
      >
        <p>
          <b>{{ t('emptyState.pricingTitle') }}</b> {{ pricing }}
        </p>
      </div>
    </div>
    <div
      v-if="$slots.message"
      class="entity-empty-state-message"
    >
      <slot name="message" />
    </div>
    <div
      v-if="(actionButtonText) || $slots.action"
      class="entity-empty-state-action"
    >
      <KButton
        appearance="primary"
        size="large"
        @click="$emit('click-action')"
      >
        {{ actionButtonText }}
      </KButton>
      <KButton
        v-if="learnMoreLink"
        appearance="secondary"
        size="large"
        :to="learnMoreLink"
      >
        <BookIcon decorative />
        {{ t('emptyState.learnMore') }}
      </KButton>
    </div>
    <div class="entity-empty-state-card-container">
      <template
        v-for="feature in features"
        :key="feature"
      >
        <KCard
          class="entity-empty-state-card"
          :title="feature.title"
        >
          <template #title>
            <component
              :is="feature.iconVariant"
              :color="`var(--kui-color-text-neutral-stronger, ${KUI_COLOR_TEXT_NEUTRAL_STRONGER})`"
              :size="KUI_ICON_SIZE_30"
            />
            <div>{{ feature.title }}</div>
          </template>
          <template #default>
            {{ feature.description }}
          </template>
        </KCard>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import { KButton } from '@kong/kongponents'
import { BookIcon } from '@kong/icons'
import composables from '../../composables'
import type { EmptyStateFeature } from 'src/types/entity-empty-state'
import { KUI_ICON_SIZE_30, KUI_COLOR_TEXT_NEUTRAL_STRONGER } from '@kong/design-tokens'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  pricing: {
    type: String,
    default: '',
  },
  actionButtonText: {
    type: String,
    default: '',
  },
  learnMoreLink: {
    type: String,
    default: '',
  },
  features: {
    type: Array as PropType<EmptyStateFeature[]>,
    default: () => [],
  },
})

defineEmits(['click-action'])

const { i18n: { t } } = composables.useI18n()
</script>

<style lang="scss" scoped>
.kong-ui-public-entity-empty-state {
  align-items: center;
  background-color: var(--kui-color-background, $kui-color-background);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  gap: var(--kui-space-100, $kui-space-100);
  padding: var(--kui-space-130, $kui-space-150) var(--kui-space-130, $kui-space-150);
  width: 100%;

  .entity-empty-state-icon {
    :deep() {
      height: var(--kui-icon-size-50, $kui-icon-size-50) !important;
      width: var(--kui-icon-size-50, $kui-icon-size-50) !important;
    }
  }

  .entity-empty-state-content {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);
    text-align: center;
    width: 100%;

    .entity-empty-state-title {
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-70, $kui-font-size-70);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      line-height: var(--kui-line-height-60, $kui-line-height-60);
    }
  }

  .entity-empty-state-description {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    max-width: 640px; // limit width so the description stays readable if it is too long

    p {
      margin: var(--kui-space-0, $kui-space-0);
    }
  }

  .entity-empty-state-action {
    align-items: center;
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
  }

  .entity-empty-state-card-container {
    display: grid !important;
    gap: var(--kui-space-60, $kui-space-60);
    grid-template-columns: auto auto !important;

    .entity-empty-state-card {
      background-color:  var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      border: $kui-border-width-10 solid $kui-color-border;
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
      gap: var(--kui-space-60, $kui-space-60);
      height: 160px;
      padding: var(--kui-space-80, $kui-space-80);
      width: 312px;

      :deep(.card-title) {
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      }

      :deep(.card-content) {
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      }
    }
  }
}
</style>
