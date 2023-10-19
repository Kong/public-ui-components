<template>
  <div class="metricscard">
    <div
      class="metricscard-title"
      :class="cardSize"
    >
      <component
        :is="iconMap.get(cardType)"
        class="metricscard-icon"
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="KUI_ICON_SIZE_30"
      />
      <span>{{ title }}</span>
      <KTooltip
        v-if="tooltip"
        class="metricscard-tooltip"
        :label="tooltip"
        placement="right"
      >
        <KIcon
          icon="info"
          size="12"
        />
      </KTooltip>
    </div>
    <div
      v-if="hasError"
      class="metricscard-error"
    >
      <KIcon
        icon="warning"
        size="20"
      />
      <div>{{ errorMessage }}</div>
    </div>
    <div
      v-else
      class="metricscard-value"
    >
      <div :style="`font-size:${metricFontSize}`">
        {{ metricValue }}
      </div>
    </div>
    <div
      v-if="cardDisplayFull"
      class="metricscard-value-trend "
      :class="textColor(changePolarity)"
    >
      <!-- Trend Icon -->
      <component
        :is="trendIcon"
        v-if="changePolarity !== 0"
        :color="colorAttribute(changePolarity)"
        :size="KUI_ICON_SIZE_30"
      />
      <div>
        {{ metricChange }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { MetricCardSize } from '../../constants'
import {
  KUI_COLOR_BORDER_DANGER_STRONG,
  // KUI_COLOR_BACKGROUND_NEUTRAL,
  KUI_FONT_SIZE_30, // 14px
  KUI_FONT_SIZE_100, // 48px
  KUI_ICON_SIZE_30,
  KUI_COLOR_TEXT_SUCCESS, // Positive trend
  KUI_COLOR_TEXT_NEUTRAL_STRONG, // Neutral trend
  KUI_COLOR_TEXT_NEUTRAL,
} from '@kong/design-tokens'
import { CloudUploadIcon, ResponseIcon, VitalsIcon, WarningOutlineIcon } from '@kong/icons'
import { MetricCardType } from '../../enums'

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
  },
  title: {
    type: String,
    default: '0%',
    required: true,
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
    default: () => 'lg',
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

const metricFontSize = props.cardSize === MetricCardSize.ExtraLarge
  ? KUI_FONT_SIZE_100
  : [MetricCardSize.Medium, MetricCardSize.Large].includes(props.cardSize) ? '22px' : KUI_FONT_SIZE_30

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

.metricscard {
  display: flex;
  flex-direction: column;
  row-gap: 16px;
  width: 100%;

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    max-width: none;
    width: auto;
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

    &.sm {
      font-size: $kui-font-size-20;
    }
  }

  &-icon {
    margin-right: 6px;
  }

  &-value {
    color: var(--kong-ui-metric-card-value, $kui-color-text);
    display: flex;
    flex-direction: row;
    font-weight: $kui-font-weight-medium;
    justify-content: space-between;
    // margin: $kui-space-40 $kui-space-0 $kui-space-0 $kui-space-0;

    &-trend {
      align-items: center;
      border-radius: 4px;
      display: flex;
      flex-direction: row;
      font-size: $kui-font-size-30;
      padding: 4px;

      .kong-icon {
        display: flex;
      }
      &.positive {
        background-color: var(--kong-ui-metric-card-trend-bg-positive, $kui-color-background-success-weakest);
        color: var(--kong-ui-metric-card-trend-positive, $kui-color-text-success);
      }
      &.negative {
        background-color: var(--kong-ui-metric-card-trend-bg-negative, $kui-color-background-danger-weakest);
        color: var(--kong-ui-metric-card-trend-negative, $kui-color-border-danger-strong);
      }
      &.neutral {
        background-color: var(--kong-ui-metric-card-trend-bg-neutral, $kui-color-background-neutral-weaker);
        color: var(--kong-ui-metric-card-trend-neutral, $kui-color-text-neutral-strong);
      }
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
