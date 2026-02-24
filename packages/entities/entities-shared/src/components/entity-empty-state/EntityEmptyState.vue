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
  background-color: var(--kui-color-background, $kui-color-background);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  gap: var(--kui-space-80, $kui-space-80);
  padding: var(--kui-space-130, $kui-space-130) var(--kui-space-0, $kui-space-0);
  width: 100%;

  @media (min-width: $kui-breakpoint-mobile) {
    padding: var(--kui-space-130, $kui-space-130) var(--kui-space-150, $kui-space-150);
  }

  .empty-state-image {
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  .entity-empty-state-content {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);
    text-align: center;
    width: 100%;

    .entity-empty-state-title h1 {
      align-items: center;
      color: var(--kui-color-text, $kui-color-text);
      display: flex;
      font-size: var(--kui-font-size-70, $kui-font-size-70);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      gap: var(--kui-space-40, $kui-space-40);
      line-height: var(--kui-line-height-60, $kui-line-height-60);
      margin: var(--kui-space-0, $kui-space-0);

      &.secondary {
        font-size: var(--kui-font-size-50, $kui-font-size-50);
      }
    }
  }

  .entity-empty-state-description, .entity-empty-state-pricing {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    max-width: 640px; // limit width so the description stays readable if it is too long

    p {
      margin: var(--kui-space-0, $kui-space-0);
    }
  }

  .entity-empty-state-pricing {
    margin-top: var(--kui-space-60, $kui-space-60);
  }

  .entity-empty-state-message {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  }

  .entity-empty-state-action {
    align-items: center;
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
  }

  .entity-empty-state-card-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kui-space-60, $kui-space-60);
    justify-content: space-around;
    margin-top: var(--kui-space-40, $kui-space-40);
    /** single column on mobile */
    width: $entity-empty-state-feature-card-width;

    @media (min-width: $kui-breakpoint-mobile) {
      width: $entity-empty-state-max-width;
    }

    .entity-empty-state-card {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
      gap: var(--kui-space-40, $kui-space-40);
      height: 160px;
      padding: var(--kui-space-70, $kui-space-70);
      width: $entity-empty-state-feature-card-width;

      .feature-icon {
        color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
        display: flex;
        margin-bottom: var(--kui-space-50, $kui-space-50);

        :deep(.kui-icon) {
          height: var(--kui-icon-size-40, $kui-icon-size-40) !important;
          width: var(--kui-icon-size-40, $kui-icon-size-40) !important;
        }
      }

      :deep(.card-title) {
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      }

      :deep(.card-content) {
        -webkit-box-orient: vertical;
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        overflow: hidden;
      }
    }
  }

  .entity-empty-state-bottom-container {
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
    padding-top: var(--kui-space-110, $kui-space-110);
    width: 100%;

    @media (min-width: $kui-breakpoint-mobile) {
      width: $entity-empty-state-max-width;
    }
  }
}
</style>
