<template>
  <div class="metricscard">
    <div
      class="metricscard-title"
      :class="cardSize"
    >
      <component
        :is="iconMap.get(cardType)"
        v-if="!hideTitleIcon"
        class="metricscard-icon"
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="KUI_ICON_SIZE_30"
      />
      <component :is="titleTag">
        {{ title }}
      </component>
      <KTooltip
        v-if="tooltip"
        class="metricscard-tooltip"
        placement="right"
        :text="tooltip"
      >
        <InfoIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_30"
        />
      </KTooltip>
    </div>
    <div
      v-if="description && cardDisplayFull"
      class="metricscard-description"
    >
      <span>{{ description }}</span>
    </div>
    <!-- TODO: remove outer div once size variant no longer needed - MA-2193  -->
    <div
      class="metricscard-valuetrend"
    >
      <!-- Metric value - error -->
      <div
        v-if="hasError"
        class="metricscard-error"
      >
        <WarningIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_40"
        />
        <div>&nbsp;{{ errorMessage }}</div>
      </div>
      <!-- Metric value -->
      <div
        v-else
        class="metricscard-value"
        :class="cardSize"
        data-testid="metric-value"
      >
        {{ metricValue }}
      </div>
      <div
        v-if="cardDisplayFull"
        class="metricscard-trend"
      >
        <!-- Trend icon and percentage change -->
        <div
          class="metricscard-trend-change"
          :class="textColor(changePolarity)"
          data-testid="metric-trend-parent"
        >
          <!-- Trend Icon -->
          <component
            :is="trendIcon"
            v-if="changePolarity !== 0"
            :color="colorAttribute(changePolarity)"
            :size="KUI_ICON_SIZE_30"
          />
          <!-- No change icon -->
          <EqualIcon
            v-else
            :color="KUI_COLOR_TEXT_NEUTRAL_STRONG"
            :size="KUI_ICON_SIZE_30"
          />
          <div data-testid="metric-trend-change">
            {{ metricChange }}
          </div>
        </div>
        <!-- Trend range text -->
        <div
          v-if="trendRange"
          class="metricscard-trend-range"
        >
          {{ trendRange }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import {
  KUI_COLOR_BORDER_DANGER_STRONG,
  KUI_ICON_SIZE_30,
  KUI_ICON_SIZE_40,
  KUI_COLOR_TEXT_SUCCESS, // Positive trend
  KUI_COLOR_TEXT_NEUTRAL_STRONG, // Neutral trend
  KUI_COLOR_TEXT_NEUTRAL,
} from '@kong/design-tokens'
import { MetricCardSize, MetricCardType } from '../../enums'
import { InfoIcon, WarningIcon, IndeterminateSmallIcon, CloudUploadIcon, EqualIcon, ResponseIcon, VitalsIcon, WarningOutlineIcon } from '@kong/icons'
import type { HeaderTag } from '@kong/kongponents'

// Import any one of the `@kong/icons` components to access the interface - they are all the same.
// Then alias as `GenericIcon` to provide the icon interface to the prop types.
import type { KongIcon as GenericIcon } from '@kong/icons'

const iconMap = new Map<MetricCardType, any>([
  [MetricCardType.GENERIC_COUNT, VitalsIcon],
  [MetricCardType.TRAFFIC, CloudUploadIcon],
  [MetricCardType.ERROR_RATE, WarningOutlineIcon],
  [MetricCardType.LATENCY, ResponseIcon],
])

const props = defineProps({
  cardType: {
    type: String as PropType<MetricCardType>,
    required: true,
    default: MetricCardType.GENERIC_COUNT,
  },
  title: {
    type: String,
    default: '0%',
    required: true,
  },
  description: {
    type: String,
    default: '',
    required: false,
  },
  tooltip: {
    type: String,
    required: false,
    default: '',
  },
  timeframe: {
    type: String,
    required: false,
    default: '',
  },
  metricValue: {
    type: String,
    default: '',
  },
  metricChange: {
    type: String,
    required: true,
  },
  changePolarity: {
    type: Number,
    required: true,
  },
  trendIcon: {
    type: Object as PropType<typeof GenericIcon>,
    default: IndeterminateSmallIcon,
  },
  trendRange: {
    type: String,
    default: '',
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: 'Vitals data error',
  },
  cardSize: {
    type: String as PropType<MetricCardSize>,
    required: false,
    default: () => MetricCardSize.Large,
  },
  hasContainerTitle: {
    type: Boolean,
    required: false,
    default: false,
  },
  titleTag: {
    type: String as PropType<HeaderTag>,
    default: 'span',
  },
})

const colorAttribute = (polarity: number): string => {
  const trendColor = {
    red: `var(--kong-ui-metric-card-trend-negative, ${KUI_COLOR_BORDER_DANGER_STRONG})`,
    green: `var(--kong-ui-metric-card-trend-positive, ${KUI_COLOR_TEXT_SUCCESS})`,
    grey: `var(--kong-ui-metric-card-trend-neutral, ${KUI_COLOR_TEXT_NEUTRAL_STRONG})`,
  }

  return polarity > 0
    ? trendColor.green
    : polarity < 0
      ? trendColor.red
      : trendColor.grey
}

const textColor = (polarity: number): string => {
  return polarity > 0
    ? 'positive'
    : polarity < 0
      ? 'negative'
      : 'neutral'
}

const cardDisplayFull = [MetricCardSize.Medium, MetricCardSize.Large].includes(props.cardSize)

const hideTitleIcon = [MetricCardSize.Small].includes(props.cardSize)
</script>

<style lang="scss">
@import "../../styles/base";

.metricscard-tooltip {
  @include pointer-events-all;
}

// If card is used inside a TabPanel, only the active tab should trigger tooltip hover
.trafficcard {
  &.active {
    .metricscard-tooltip {
      @include pointer-events-all;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "../../styles/base";
$row-gap-size: 12px;

.metricscard {
  display: flex;
  flex-direction: column;
  width: 100%;

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    max-width: none;
    width: auto;
  }

  @media (min-width: $kui-breakpoint-phablet) {
    height: 100%;
    justify-content: space-evenly;
  }

  &:hover {
    border: none;
    text-decoration: none;
  }

  &-title {
    align-items: center;
    color: var(--kong-ui-metric-card-title, $kui-color-text);
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-medium;
    line-height: $kui-line-height-20;
    margin: $kui-space-0;

    // The metric card title is always 14px; the "small" variant is the exception
    &.sm {
      font-size: $kui-font-size-20;
    }
    &.md {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-semibold;
    }
    &.lg {
      font-size: $kui-font-size-30;
    }
    &.xl {
      font-size: $kui-font-size-30;
    }
  }

  &-description {
    color: var(--kong-ui-metric-card-value, $kui-color-text-disabled);
    font-size: $kui-font-size-20;
    line-height: $kui-line-height-20;
    margin-top: 10px;
  }

  &-icon {
    margin-right: $kui-space-20;
  }

  &-value {
    color: var(--kong-ui-metric-card-value, $kui-color-text);
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-70;
    font-weight: $kui-font-weight-semibold;
    justify-content: space-between;
    line-height: $kui-line-height-60;

    &.sm {
      font-size: $kui-font-size-30;
      line-height: $kui-line-height-40;
    }
    &.xl {
      font-size: $kui-font-size-100;
    }
  }

  &-valuetrend {
    display: flex;
    flex-direction: column;
    row-gap: $row-gap-size;

    &.is-compact {
      align-items: center;
      flex-direction: row !important;
      justify-content: space-between;
      margin-top: 0;
    }
  }

  &-trend {
    align-items: center;
    column-gap: 8px;
    display: flex;

    &-change {
      align-items: center;
      border-radius: 4px;
      display: flex;
      flex-direction: row;
      font-size: $kui-font-size-20;
      font-weight: $kui-font-weight-semibold;
      padding: $kui-space-20 $kui-space-40;

      .kui-icon {
        margin-right: 4px;
      }
      &.positive {
        background-color: var(--kong-ui-metric-card-trend-bg-positive, $kui-color-background-success-weakest);
        color: var(--kong-ui-metric-card-trend-positive, $kui-color-text-success);
      }
      &.negative {
        background-color: var(--kong-ui-metric-card-trend-bg-negative, $kui-color-background-danger-weakest);
        color: var(--kong-ui-metric-card-trend-negative, $kui-color-text-danger-strong);
      }
      &.neutral {
        background-color: var(--kong-ui-metric-card-trend-bg-neutral, $kui-color-background-neutral-weaker);
        color: var(--kong-ui-metric-card-trend-neutral, $kui-color-text-neutral-strong);
      }
    }

    &-range {
      color: $kui-color-text;
      font-size: $kui-font-size-20;
    }
  }

  &-tooltip {
    display: inline-flex;
    margin: $kui-space-auto $kui-space-0 $kui-space-auto $kui-space-20;
    vertical-align: middle;
  }

  &-error {
    align-items: center;
    color: $kui-color-text-neutral-stronger;
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-20;
    margin-top: $kui-space-40;

    .kong-icon-warning {
      margin-right: $kui-space-50;
    }
  }

  // Only currently active tab should trigger tooltip hover
  &.active {
    .metricscard-tooltip {
      @include pointer-events-all;
    }
  }
}
</style>
