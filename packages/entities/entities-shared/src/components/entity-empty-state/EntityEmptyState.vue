<template>
  <div class="kong-ui-public-entity-empty-state">
    <div v-if="$slots.image">
      <slot name="image" />
    </div>
    <div class="entity-empty-state-content">
      <div
        v-if="title || $slots.title || $slots['title-after']"
        class="entity-empty-state-title"
      >
        <slot name="title" />
        <div :title="title">
          {{ title }}
        </div>
        <span v-if="$slots['title-after']">
          <slot name="title-after" />
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
          <b>{{ t('emptyState.pricingTitle') }}</b> <slot name="pricing">
            {{ pricing }}
          </slot>
        </p>
      </div>
    </div>
    <div
      v-if="$slots.message"
      class="entity-empty-state-message"
    >
      <slot name="message" />
    </div>
    <div class="entity-empty-state-action">
      <KButton
        v-if="actionButtonText || $slots.action"
        appearance="primary"
        size="large"
        @click="$emit('create-button-clicked')"
      >
        <AddIcon />
        {{ actionButtonText }}
      </KButton>
      <KButton
        v-if="learnMoreLink"
        appearance="secondary"
        size="large"
        @click="$emit('learning-hub-button-clicked')"
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
        <KCard class="entity-empty-state-card">
          <template #title>
            <component
              :is="getEntityIcon(feature.iconVariant)"
              :color="KUI_COLOR_TEXT_NEUTRAL_STRONGER"
              :size="KUI_ICON_SIZE_40"
            />
            <div class="card-header">
              {{ feature.title }}
            </div>
          </template>
          {{ feature.description }}
        </KCard>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import { KButton } from '@kong/kongponents'
import { BookIcon, AddIcon, DeployIcon, PlugIcon, ChartDataIcon, AnalyticsIcon } from '@kong/icons'
import composables from '../../composables'
import type { EmptyStateFeature } from 'src/types/entity-empty-state'
import { KUI_ICON_SIZE_40, KUI_COLOR_TEXT_NEUTRAL_STRONGER } from '@kong/design-tokens'

const getEntityIcon = (iconType: string): object => {
  switch (iconType) {
    case 'deploy':
      return DeployIcon
    case 'plug':
      return PlugIcon
    case 'chartData':
      return ChartDataIcon
    case 'analytics':
      return AnalyticsIcon
    default:
      return BookIcon
  }
}

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
    type: Boolean,
    default: false,
  },
  actionButtonText: {
    type: String,
    default: '',
  },
  learnMoreLink: {
    type: Boolean,
    default: false,
  },
  features: {
    type: Array as PropType<EmptyStateFeature[]>,
    default: () => [],
  },
})

defineEmits(['create-button-clicked', 'learning-hub-button-clicked'])

const { i18n: { t } } = composables.useI18n()
</script>

<style lang="scss" scoped>
.kong-ui-public-entity-empty-state {
  align-items: center;
  background-color: $kui-color-background;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: $kui-font-family-text;
  gap: $kui-space-90;
  padding: $kui-space-130 $kui-space-150;
  width: 100%;

  .entity-empty-state-content {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    text-align: center;
    width: 100%;

    .entity-empty-state-title {
      color: $kui-color-text;
      font-size: $kui-font-size-70;
      font-weight: $kui-font-weight-bold;
      line-height: $kui-line-height-60;
    }
  }

  .entity-empty-state-description, .entity-empty-state-pricing {
    color: $kui-color-text-neutral-strong;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-regular;
    line-height: $kui-line-height-30;
    max-width: 640px; // limit width so the description stays readable if it is too long

    p {
      margin: $kui-space-30;
    }
  }

  .entity-empty-state-action {
    align-items: center;
    display: flex;
    gap: $kui-space-50;
  }

  .entity-empty-state-card-container {
    display: grid !important;
    gap: $kui-space-60;
    grid-template-columns: auto auto !important;

    .entity-empty-state-card {
      background-color: $kui-color-background-neutral-weakest;
      border: $kui-border-width-10 solid $kui-color-border;
      border-radius: $kui-border-radius-30;
      color: $kui-color-text-neutral-weak;
      gap: $kui-space-40;
      height: 160px;
      padding: $kui-space-80;
      width: 312px;

      :deep(.card-title) {
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-semibold;
      }

      :deep(.card-header) {
        padding-top: $kui-space-40;
      }

      :deep(.card-content) {
        color: $kui-color-text-neutral;
      }
    }
  }
}
</style>
