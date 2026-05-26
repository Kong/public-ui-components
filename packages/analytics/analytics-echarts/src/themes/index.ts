import {
  KUI_COLOR_BACKGROUND,
  KUI_COLOR_BACKGROUND_DANGER_WEAK,
  KUI_COLOR_BACKGROUND_INFO_WEAK,
  KUI_COLOR_BACKGROUND_INVERSE,
  KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  KUI_COLOR_BACKGROUND_WARNING_WEAK,
  KUI_COLOR_BORDER,
  KUI_COLOR_BORDER_INVERSE,
  KUI_COLOR_BORDER_NEUTRAL_STRONG,
  KUI_COLOR_TEXT,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  KUI_COLOR_TEXT_INVERSE,
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_STATUS_COLOR_100S,
  KUI_STATUS_COLOR_200S,
  KUI_STATUS_COLOR_300S,
  KUI_STATUS_COLOR_400S,
  KUI_STATUS_COLOR_500S,
} from '@kong/design-tokens'
import { registerTheme } from 'echarts/core'
import { computed, inject, toValue } from 'vue'
import { THEME_KEY } from 'vue-echarts'

const KONNECT_ECHARTS_THEME_NAME = 'konnect'
const KONNECT_DARK_ECHARTS_THEME_NAME = 'konnect-dark'

export const defaultEchartsThemePalette = [
  '#a86cd5',
  '#6a86d2',
  '#00bbf9',
  '#00c4b0',
  '#ffdf15',
]

type AnalyticsEchartsTheme = {
  color?: string[]
  [key: string]: unknown
}

export const konnectThemePalette = [
  KUI_STATUS_COLOR_200S,
  KUI_STATUS_COLOR_100S,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_STATUS_COLOR_300S,
  KUI_STATUS_COLOR_400S,
  KUI_STATUS_COLOR_500S,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
]

const konnectDarkThemePalette = [
  KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  KUI_COLOR_BACKGROUND_INFO_WEAK,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_BACKGROUND_WARNING_WEAK,
  KUI_COLOR_BACKGROUND_DANGER_WEAK,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
]

export const createAnalyticsEchartsTheme = ({
  axisColor,
  backgroundColor,
  color,
  gridLineColor,
  textColor,
}: {
  axisColor: string
  backgroundColor: string
  color: string[]
  gridLineColor: string
  textColor: string
}) => ({
  color,
  backgroundColor,
  textStyle: {
    color: textColor,
  },
  title: {
    textStyle: {
      color: textColor,
    },
  },
  legend: {
    textStyle: {
      color: textColor,
    },
  },
  line: {
    itemStyle: {
      borderWidth: 2,
    },
    lineStyle: {
      width: 2,
    },
    symbol: 'circle',
    symbolSize: 6,
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: axisColor,
      },
    },
    axisLabel: {
      color: textColor,
    },
    splitLine: {
      lineStyle: {
        color: gridLineColor,
      },
    },
  },
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: axisColor,
      },
    },
    axisLabel: {
      color: textColor,
    },
    splitLine: {
      lineStyle: {
        color: gridLineColor,
      },
    },
  },
  timeAxis: {
    axisLine: {
      lineStyle: {
        color: axisColor,
      },
    },
    axisLabel: {
      color: textColor,
    },
    splitLine: {
      lineStyle: {
        color: gridLineColor,
      },
    },
  },
})

export const konnectTheme = createAnalyticsEchartsTheme({
  axisColor: KUI_COLOR_TEXT_NEUTRAL,
  backgroundColor: KUI_COLOR_BACKGROUND,
  color: konnectThemePalette,
  gridLineColor: KUI_COLOR_BORDER,
  textColor: KUI_COLOR_TEXT,
})

export const konnectDarkTheme = createAnalyticsEchartsTheme({
  axisColor: KUI_COLOR_BORDER_INVERSE,
  backgroundColor: KUI_COLOR_BACKGROUND_INVERSE,
  color: konnectDarkThemePalette,
  gridLineColor: KUI_COLOR_BORDER_NEUTRAL_STRONG,
  textColor: KUI_COLOR_TEXT_INVERSE,
})

const analyticsEchartsThemes: Record<string, AnalyticsEchartsTheme> = {
  light: {
    color: defaultEchartsThemePalette,
  },
  dark: {
    color: defaultEchartsThemePalette,
  },
  [KONNECT_ECHARTS_THEME_NAME]: konnectTheme,
  [KONNECT_DARK_ECHARTS_THEME_NAME]: konnectDarkTheme,
}

let analyticsEchartsThemesRegistered = false

export const registerAnalyticsEchartsThemes = () => {
  if (analyticsEchartsThemesRegistered) {
    return
  }

  registerTheme(KONNECT_ECHARTS_THEME_NAME, konnectTheme)
  registerTheme(KONNECT_DARK_ECHARTS_THEME_NAME, konnectDarkTheme)
  analyticsEchartsThemesRegistered = true
}

export const registerAnalyticsEchartsTheme = (name: string, theme: AnalyticsEchartsTheme) => {
  analyticsEchartsThemes[name] = theme
  registerTheme(name, theme)
}

const isThemeObject = (theme: unknown): theme is AnalyticsEchartsTheme => {
  return typeof theme === 'object' && theme !== null
}

const isPalette = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.length > 0 && value.every(color => typeof color === 'string')
}

export const resolveAnalyticsEchartsThemePalette = (theme: unknown): string[] => {
  const resolvedTheme = typeof theme === 'string'
    ? analyticsEchartsThemes[theme]
    : isThemeObject(theme)
      ? theme
      : undefined

  return isPalette(resolvedTheme?.color)
    ? resolvedTheme.color
    : defaultEchartsThemePalette
}

export const useAnalyticsEchartsThemePalette = () => {
  const injectedTheme = inject(THEME_KEY, 'light')

  return computed(() => resolveAnalyticsEchartsThemePalette(toValue(injectedTheme)))
}
