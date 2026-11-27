<template>
  <section
    class="kong-ui-public-about-card"
    data-testid="about-card"
  >
    <header
      v-if="title || $slots.title || description || $slots.description || $slots.actions"
      class="about-card-header"
      data-testid="about-card-header"
    >
      <div class="about-card-header-text">
        <component
          :is="titleTag"
          v-if="title || $slots.title"
          class="about-card-title"
          data-testid="about-card-title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </component>

        <p
          v-if="description || $slots.description"
          ref="descriptionEl"
          class="about-card-description"
          data-testid="about-card-description"
          :title="truncated ? descriptionText : undefined"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </p>
      </div>

      <div
        v-if="$slots.actions"
        class="about-card-actions"
        data-testid="about-card-actions"
      >
        <slot name="actions" />
      </div>
    </header>

    <div class="about-card-panel">
      <div
        v-if="isLoading"
        class="about-card-skeleton"
        data-testid="about-card-skeleton"
      >
        <KSkeletonBox
          v-for="i in skeletonRowCount"
          :key="i"
          height="2"
          width="100"
        />
      </div>

      <dl
        v-else-if="rows.length"
        class="about-card-rows"
        data-testid="about-card-rows"
      >
        <!-- A `div` wrapping each dt/dd pair is valid inside `dl` and is what lets
        each row lay out (and stack) as a unit. -->
        <div
          v-for="row in rows"
          :key="row.key"
          class="about-card-row"
          :data-testid="`about-card-row-${row.key}`"
        >
          <dt class="about-card-row-label">
            <slot
              :name="`label-${row.key}`"
              :row="row"
            >
              <span class="about-card-row-text">{{ row.label }}</span>
            </slot>

            <KTooltip
              v-if="row.tooltip"
              :text="row.tooltip"
            >
              <!-- A button (rather than a bare icon) so the tooltip is reachable by keyboard. -->
              <button
                :aria-label="row.tooltip"
                class="about-card-row-tooltip-trigger"
                :data-testid="`about-card-row-${row.key}-tooltip`"
                type="button"
              >
                <InfoIcon :size="`var(--kui-icon-size-20, ${KUI_ICON_SIZE_20})`" />
              </button>
            </KTooltip>
          </dt>

          <dd class="about-card-row-value">
            <slot
              :name="`row-${row.key}`"
              :row="row"
            >
              <span class="about-card-row-text">{{ row.value }}</span>
            </slot>
          </dd>
        </div>
      </dl>

      <div
        v-if="$slots.default"
        class="about-card-content"
        data-testid="about-card-content"
      >
        <slot name="default" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { InfoIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { useTruncatedText } from '../composables/useTruncatedText'
import type { AboutCardProps, AboutCardSlots } from '../types'

const {
  title = '',
  titleTag = 'h2',
  description = '',
  rows = [],
  isLoading = false,
} = defineProps<AboutCardProps>()

defineSlots<AboutCardSlots>()

// One line, always: when the copy does not fit, it ends in an ellipsis and the whole text
// moves to a native tooltip. The tooltip appears only when the text is actually truncated.
const descriptionEl = ref<HTMLElement | null>(null)
const { truncated, text: descriptionText } = useTruncatedText(() => descriptionEl.value)

// Keep the loading state roughly the height of the real content so the card
// doesn't jump when the rows arrive.
const skeletonRowCount = computed<number>(() => rows.length || 4)
</script>

<style lang="scss" scoped>
.kong-ui-public-about-card {
  background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-40, $kui-border-radius-40);
  box-sizing: border-box;
  // The card is typically rendered in a narrow aside, so the rows respond to the
  // card's own width rather than the viewport's.
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-20, $kui-space-20);
  padding: var(--kui-space-10, $kui-space-10);
}

.about-card-header {
  align-items: center;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  padding: var(--kui-space-40, $kui-space-40);
}

.about-card-header-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--kui-space-10, $kui-space-10);
  min-width: 0;
}

.about-card-title {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  margin: var(--kui-space-0, $kui-space-0);
}

.about-card-description {
  // One line: the ellipsis is CSS, the tooltip comes from `useTruncatedText`.
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-10, $kui-font-size-10);
  line-height: var(--kui-line-height-10, $kui-line-height-10);
  margin: var(--kui-space-0, $kui-space-0);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about-card-actions {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: var(--kui-space-40, $kui-space-40);
}

.about-card-panel {
  background-color: var(--kui-color-background, $kui-color-background);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--kui-space-50, $kui-space-50);

  .about-card-skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-50, $kui-space-50);
  }

  .about-card-rows {
    display: flex;
    flex-direction: column;
    margin: var(--kui-space-0, $kui-space-0);
  }

  .about-card-row {
    align-items: center;
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    box-sizing: border-box;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    min-height: 47px;
    padding: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0);

    &:last-child {
      border-bottom: none;
      padding-bottom: var(--kui-space-0, $kui-space-0);
    }

    &:first-child {
      padding-top: var(--kui-space-0, $kui-space-0);
    }
  }

  .about-card-row-label {
    align-items: center;
    color: var(--kui-color-text, $kui-color-text);
    display: flex;
    flex: 0 0 auto;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    width: 140px;
  }

  // Long labels and values wrap, then clamp, so one unusually long row can't
  // stretch the card out of shape.
  .about-card-row-text {
    -webkit-box-orient: vertical;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  .about-card-row-tooltip-trigger {
    align-items: center;
    background: none;
    border: none;
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    cursor: pointer;
    display: flex;
    padding: var(--kui-space-0, $kui-space-0);
  }

  .about-card-row-value {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    flex: 1 1 0;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    margin: var(--kui-space-0, $kui-space-0);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .about-card-content {
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  // Below this the two columns no longer leave the value a usable amount of
  // room, so the label moves above its value.
  @container (max-width: 320px) {
    .about-card-row {
      align-items: flex-start;
      flex-direction: column;
      gap: var(--kui-space-10, $kui-space-10);
    }

    .about-card-row-label {
      width: auto;
    }
  }
}
</style>
