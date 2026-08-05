<template>
  <KCard
    class="kong-ui-onboarding-card"
    data-testid="onboarding-card"
  >
    <template #title>
      <span
        class="onboarding-card-title"
        data-testid="onboarding-card-title"
      >
        {{ title }}
      </span>
      <div
        v-if="subtitle"
        class="onboarding-card-subtitle"
        data-testid="onboarding-card-subtitle"
      >
        {{ subtitle }}
      </div>
    </template>

    <template
      v-if="dismissible"
      #actions
    >
      <KButton
        appearance="none"
        :aria-label="t('onboardingCard.dismissLabel')"
        data-testid="onboarding-card-close"
        icon
        @click="$emit('dismiss')"
      >
        <CloseIcon decorative />
      </KButton>
    </template>

    <DefineItemCard v-slot="{ item }">
      <KCard
        class="onboarding-item"
        :class="{ 'vertical-item': item.variant === 'vertical' }"
      >
        <div
          v-if="item.icon"
          class="onboarding-item-icon-box"
          :style="{
            backgroundColor: ICON_APPEARANCE_COLORS[item.appearance ?? 'success'].background,
            borderColor: ICON_APPEARANCE_COLORS[item.appearance ?? 'success'].border,
          }"
        >
          <component
            :is="item.icon"
            :color="ICON_APPEARANCE_COLORS[item.appearance ?? 'success'].foreground"
            decorative
            :size="`var(--kui-icon-size-50, ${KUI_ICON_SIZE_50})`"
          />
        </div>
        <div class="onboarding-item-content">
          <div class="onboarding-item-title">
            {{ item.title }}
          </div>
          <div
            v-if="item.description"
            class="onboarding-item-description"
          >
            {{ item.description }}
          </div>
        </div>
      </KCard>
    </DefineItemCard>

    <div class="onboarding-items-grid">
      <template
        v-for="(item, index) in items"
        :key="index"
      >
        <router-link
          v-if="item.to"
          class="onboarding-item-wrapper"
          :data-testid="`onboarding-item-${index}`"
          :to="item.to"
        >
          <ReuseItemCard :item="item" />
        </router-link>
        <a
          v-else-if="item.href"
          class="onboarding-item-wrapper"
          :data-testid="`onboarding-item-${index}`"
          :href="item.href"
          rel="noopener noreferrer"
          target="_blank"
        >
          <ReuseItemCard :item="item" />
        </a>
        <button
          v-else-if="item.onClick"
          class="onboarding-item-wrapper"
          :data-testid="`onboarding-item-${index}`"
          type="button"
          @click="item.onClick()"
        >
          <ReuseItemCard :item="item" />
        </button>
        <div
          v-else
          class="onboarding-item-wrapper is-static"
          :data-testid="`onboarding-item-${index}`"
        >
          <ReuseItemCard :item="item" />
        </div>
      </template>
    </div>
  </KCard>
</template>

<script setup lang="ts">
import { CloseIcon } from '@kong/icons'
import {
  KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  KUI_COLOR_BACKGROUND_NEUTRAL_WEAKEST,
  KUI_COLOR_BACKGROUND_SUCCESS_WEAKEST,
  KUI_COLOR_BORDER_DECORATIVE_PURPLE,
  KUI_COLOR_BORDER_NEUTRAL_STRONGER,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  KUI_COLOR_TEXT_NEUTRAL_STRONGER,
  KUI_COLOR_TEXT_SUCCESS,
  KUI_ICON_SIZE_50,
} from '@kong/design-tokens'
import { createReusableTemplate } from '@vueuse/core'
import composables from '../../composables'
import type { OnboardingCardItem, OnboardingCardItemAppearance } from '../../types'

const { i18n: { t } } = composables.useI18n()

const {
  title,
  subtitle,
  items,
  dismissible = true,
} = defineProps<{
  title: string
  subtitle?: string
  items: OnboardingCardItem[]
  dismissible?: boolean
}>()

defineEmits<{
  dismiss: []
}>()

const [DefineItemCard, ReuseItemCard] = createReusableTemplate<{ item: OnboardingCardItem }>()

// Icon box background/foreground/border per `OnboardingCardItem.appearance`, akin to `KBadge`'s appearance palette.
// Border reuses the same color as the foreground; some appearances have no dedicated `--kui-color-border-*` token, so the text token's value is used as the fallback.
const ICON_APPEARANCE_COLORS: Record<OnboardingCardItemAppearance, { background: string, foreground: string, border: string }> = {
  success: {
    background: `var(--kui-color-background-success-weakest, ${KUI_COLOR_BACKGROUND_SUCCESS_WEAKEST})`,
    foreground: `var(--kui-color-text-success, ${KUI_COLOR_TEXT_SUCCESS})`,
    border: `var(--kui-color-border-success, ${KUI_COLOR_TEXT_SUCCESS})`,
  },
  'decorative-purple': {
    background: `var(--kui-color-background-decorative-purple-weakest, ${KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST})`,
    foreground: `var(--kui-color-text-decorative-purple, ${KUI_COLOR_TEXT_DECORATIVE_PURPLE})`,
    border: `var(--kui-color-border-decorative-purple, ${KUI_COLOR_BORDER_DECORATIVE_PURPLE})`,
  },
  'decorative-aqua': {
    background: `var(--kui-color-background-decorative-aqua-weakest, ${KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST})`,
    foreground: `var(--kui-color-text-decorative-aqua, ${KUI_COLOR_TEXT_DECORATIVE_AQUA})`,
    border: `var(--kui-color-border-decorative-aqua, ${KUI_COLOR_TEXT_DECORATIVE_AQUA})`,
  },
  neutral: {
    background: `var(--kui-color-background-neutral-weakest, ${KUI_COLOR_BACKGROUND_NEUTRAL_WEAKEST})`,
    foreground: `var(--kui-color-text-neutral-stronger, ${KUI_COLOR_TEXT_NEUTRAL_STRONGER})`,
    border: `var(--kui-color-border-neutral-stronger, ${KUI_COLOR_BORDER_NEUTRAL_STRONGER})`,
  },
}
</script>

<style lang="scss" scoped>
.kong-ui-onboarding-card {
  background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);

  .onboarding-card-subtitle {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    margin-top: var(--kui-space-20, $kui-space-20);
  }

  .onboarding-items-grid {
    display: grid;
    gap: var(--kui-space-60, $kui-space-60);
    grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  }

  .onboarding-item-wrapper {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    font: inherit;
    padding: var(--kui-space-0, $kui-space-0);
    text-align: left;
    text-decoration: none;

    &.is-static {
      cursor: default;
    }

    &:not(.is-static):hover .onboarding-item {
      border-color: var(--kui-color-border-primary, $kui-color-border-primary);
      box-shadow: var(--kui-shadow, $kui-shadow);
    }

    .onboarding-item {
      flex: 1;

      :deep(.card-content) {
        display: flex;
        gap: var(--kui-space-50, $kui-space-50);
      }

      &:not(.vertical-item) :deep(.card-content) {
        align-items: flex-start;
        flex-direction: row;
      }

      &.vertical-item :deep(.card-content) {
        align-items: center;
        flex-direction: column;
        justify-content: center;
        text-align: center;

        .onboarding-item-content {
          flex: none;
        }
      }
    }
  }

  .onboarding-item-icon-box {
    align-items: center;
    border: var(--kui-border-width-10, $kui-border-width-10) solid transparent;
    border-radius: var(--kui-border-radius-40, $kui-border-radius-40);
    display: flex;
    flex-shrink: 0;
    height: 56px;
    justify-content: center;
    width: 56px;
  }

  .onboarding-item-content {
    flex: 1;
    min-width: 0;
  }

  .onboarding-item-title {
    color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  .onboarding-item-description {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    margin-top: var(--kui-space-20, $kui-space-20);
    overflow-wrap: break-word;
  }
}
</style>
