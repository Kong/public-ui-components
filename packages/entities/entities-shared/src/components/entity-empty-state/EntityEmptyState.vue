<template>
  <div class="kong-ui-public-entity-empty-state">
    <div class="entity-empty-state-content">
      <div
        v-if="$slots.image"
        class="empty-state-image"
      >
        <slot name="image" />
      </div>

      <div
        v-if="title || $slots.title"
        class="entity-empty-state-title"
      >
        <h1 :class="emptyStateAppearance">
          <slot name="title">
            {{ title }}
          </slot>
        </h1>
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
        v-if="pricing || $slots.pricing"
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

    <div
      v-if="showCreateButton || learnMore || $slots.actions"
      class="entity-empty-state-action"
    >
      <slot name="actions">
        <KButton
          v-if="showCreateButton"
          appearance="primary"
          data-testid="entity-create-button"
          :size="appearance === 'secondary' ? 'medium' : 'large'"
          @click="$emit('click:create')"
        >
          <AddIcon />
          {{ actionButtonText }}
        </KButton>

        <KButton
          v-if="learnMore"
          appearance="secondary"
          data-testid="entity-learn-more-button"
          :size="appearance === 'secondary' ? 'medium' : 'large'"
          @click="$emit('click:learn-more')"
        >
          <BookIcon decorative />
          {{ t('emptyState.learnMore') }}
        </KButton>
      </slot>
    </div>

    <div
      v-if="features.length"
      class="entity-empty-state-card-container"
    >
      <template
        v-for="(feature, idx) in features"
        :key="`feature-${idx}-card`"
      >
        <KCard class="entity-empty-state-card">
          <template #title>
            <div
              v-if="$slots[`feature-${idx}-icon`]"
              class="feature-icon"
            >
              <slot :name="`feature-${idx}-icon`" />
            </div>

            <div class="card-header">
              {{ feature.title }}
            </div>
          </template>

          <div :title="feature.description">
            {{ feature.description }}
          </div>
        </KCard>
      </template>
    </div>

    <div
      v-if="$slots.bottom"
      class="entity-empty-state-bottom-container"
    >
      <slot name="bottom" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type PropType, computed, ref, onBeforeMount, warn, onMounted } from 'vue'
import { KButton } from '@kong/kongponents'
import { BookIcon, AddIcon } from '@kong/icons'
import composables from '../../composables'
import type { EmptyStateFeature, AppearanceTypes } from '../../types/entity-empty-state'
import { Appearances } from '../../types/entity-empty-state'

const props = defineProps({
  appearance: {
    type: String as PropType<AppearanceTypes>,
    default: () => 'primary',
    validator: (value: AppearanceTypes): boolean => {
      return Appearances.includes(value)
    },
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  pricing: {
    type: String,
    default: '',
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new entity */
  canCreate: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  actionButtonText: {
    type: String,
    default: '',
  },
  learnMore: {
    type: Boolean,
    default: false,
  },
  features: {
    type: Array as PropType<EmptyStateFeature[]>,
    default: () => [],
  },
})

defineEmits<{
  (e: 'click:create'): void
  (e: 'click:learn-more'): void
}>()

const { i18n: { t } } = composables.useI18n()

const useCanCreate = ref(false)
const showCreateButton = computed((): boolean => useCanCreate.value && !!props.actionButtonText)

const emptyStateAppearance = computed((): AppearanceTypes | [AppearanceTypes, string] => {
  // If the appearance is invalid, output both to keep backwards compatibility
  // in case some of the tests rely on the invalid appearance output
  if (!Appearances.includes(props.appearance)) {
    return ['primary', props.appearance]
  }

  return props.appearance
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  useCanCreate.value = await props.canCreate()
})

onMounted(() => warn('EntityEmptyState is deprecated and will be removed in future releases. Please use the KEmptyState component instead.\nDocs: https://kongponents.konghq.com/components/empty-state.html.'))
</script>

<style lang="scss" scoped>
$entity-empty-state-feature-card-width: 312px;
$entity-empty-state-max-width: calc(2 * #{$entity-empty-state-feature-card-width} + #{$kui-space-60}); // 2 columns per row + gap

.kong-ui-public-entity-empty-state {
  align-items: center;
  background-color: $kui-color-background;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: $kui-font-family-text;
  gap: $kui-space-80;
  padding: $kui-space-130 $kui-space-0;
  width: 100%;

  @media (min-width: $kui-breakpoint-mobile) {
    padding: $kui-space-130 $kui-space-150;
  }

  .empty-state-image {
    margin-bottom: $kui-space-40;
  }

  .entity-empty-state-content {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    text-align: center;
    width: 100%;

    .entity-empty-state-title h1 {
      align-items: center;
      color: $kui-color-text;
      display: flex;
      font-size: $kui-font-size-70;
      font-weight: $kui-font-weight-bold;
      gap: $kui-space-40;
      line-height: $kui-line-height-60;
      margin: $kui-space-0;

      &.secondary {
        font-size: $kui-font-size-50;
      }
    }
  }

  .entity-empty-state-description, .entity-empty-state-pricing {
    color: $kui-color-text-neutral-strong;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-regular;
    line-height: $kui-line-height-30;
    max-width: 640px; // limit width so the description stays readable if it is too long

    p {
      margin: $kui-space-0;
    }
  }

  .entity-empty-state-pricing {
    margin-top: $kui-space-60;
  }

  .entity-empty-state-message {
    color: $kui-color-text-neutral-strong;
  }

  .entity-empty-state-action {
    align-items: center;
    display: flex;
    gap: $kui-space-50;
  }

  .entity-empty-state-card-container {
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-60;
    justify-content: space-around;
    margin-top: $kui-space-40;
    /** single column on mobile */
    width: $entity-empty-state-feature-card-width;

    @media (min-width: $kui-breakpoint-mobile) {
      width: $entity-empty-state-max-width;
    }

    .entity-empty-state-card {
      background-color: $kui-color-background-neutral-weakest;
      border: $kui-border-width-10 solid $kui-color-border;
      border-radius: $kui-border-radius-30;
      color: $kui-color-text-neutral-weak;
      gap: $kui-space-40;
      height: 160px;
      padding: $kui-space-70;
      width: $entity-empty-state-feature-card-width;

      .feature-icon {
        color: $kui-color-text-neutral-stronger;
        display: flex;
        margin-bottom: $kui-space-50;

        :deep(.kui-icon) {
          height: $kui-icon-size-40 !important;
          width: $kui-icon-size-40 !important;
        }
      }

      :deep(.card-title) {
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-semibold;
      }

      :deep(.card-content) {
        -webkit-box-orient: vertical;
        color: $kui-color-text-neutral;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        overflow: hidden;
      }
    }
  }

  .entity-empty-state-bottom-container {
    border-top: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
    padding-top: $kui-space-110;
    width: 100%;

    @media (min-width: $kui-breakpoint-mobile) {
      width: $entity-empty-state-max-width;
    }
  }
}
</style>
