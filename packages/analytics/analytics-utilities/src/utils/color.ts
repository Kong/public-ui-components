import { computed, hasInjectionContext, inject, type ComputedRef } from 'vue'
import { djb2 } from './djb2'
import {
  statusCodeColors,
  statusCodeGroupColors,
  unknownStatusCodeColors,
  stateColors,
  type ColorState,
} from './color-overrides'
import { KUI_COLOR_BACKGROUND_NEUTRAL } from '@kong/design-tokens'
import type { ColorCoordinator } from '../types/interaction-coordinator'

// Chart series 9 is reserved for empty values.
export const lightPalette = [
  '#0076F4',
  '#00819D',
  '#00A17B',
  '#8A50FF',
  '#FF3C99',
  '#FF6D3C',
  '#B3A100',
]

export const darkPalette = [
  '#5485BA',
  '#087D96',
  '#3D8776',
  '#7654BA',
  '#A1406F',
  '#BF5430',
  '#B5A72C',
]

export const generateDiscriminator = (id: string): number => djb2(id)

/**
 * Returns the palette that `color()`/`colorByDiscriminator()` will index into for
 * the given theme and optional custom palette. Useful for callers (e.g. a color
 * coordinator) that need to know the palette length in order to assign and spread
 * discriminator indices consistently with how colors are ultimately resolved.
 */
export const getActivePalette = ({
  theme = 'light',
  customPalette = undefined,
}: {
  theme?: 'light' | 'dark'
  customPalette?: string[]
} = {}): string[] => {
  if (customPalette) {
    return customPalette
  }

  return theme === 'dark' ? darkPalette : lightPalette
}

export const colorByDiscriminator = ({
  discriminator,
  theme = 'light',
  customPalette = undefined,
}: {
  discriminator: number
  theme?: 'light' | 'dark'
  customPalette?: string[]
}): string => {
  const integerDiscriminator = Math.abs(Math.floor(discriminator))
  if (customPalette) {
    return customPalette[integerDiscriminator % customPalette.length]
  }

  return theme === 'dark'
    ? darkPalette[integerDiscriminator % darkPalette.length]
    : lightPalette[integerDiscriminator % lightPalette.length]
}

export const colorByState = ({
  state,
}: {
  state: ColorState
}): string => {
  return stateColors[state] ?? KUI_COLOR_BACKGROUND_NEUTRAL
}

export const colorByStatusCode = ({
  statusCode,
}: {
  statusCode: string | number
}): string => {
  const numericCode = typeof statusCode === 'number' ? statusCode : Number.parseInt(statusCode, 10)
  const fullCode = `${numericCode}`
  const codeClass = `${Math.floor(numericCode / 100) * 100}`

  return statusCodeColors[fullCode]
    ?? unknownStatusCodeColors[codeClass]
    ?? colorByState({ state: 'neutral' })
}

export const colorByStatusCodeGroup = ({
  group,
}: {
  group: string
}): string => {
  return statusCodeGroupColors[group]
    ? statusCodeGroupColors[group]
    : colorByState({ state: 'neutral' })
}

export const color = ({
  discriminator = undefined,
  state = undefined,
  dimension = undefined,
  dimensionValue = undefined,
  metric = undefined,
  customPalette = undefined,
  coordinator = undefined,
  order = undefined,
  chartUuid = undefined,
}: {
  discriminator?: number
  state?: ColorState
  dimension?: string
  dimensionValue?: string
  metric?: string
  customPalette?: string[]
  /**
   * An optional cross-chart color coordinator (e.g. from
   * `useInteractionCoordinator().color`). When provided, generic series colors
   * are assigned through it so they stay consistent across charts and distinct
   * within a chart. Has no effect on override colors (status codes, states,
   * empty/other) or when an explicit `discriminator` is given.
   */
  coordinator?: ColorCoordinator
  /**
   * This series' rank within its chart (e.g. 1 for the highest value). Used by
   * the coordinator to avoid giving adjacent series the same color.
   */
  order?: number
  /**
   * The uuid of the chart requesting the color. Allows the coordinator to
	 * correctly group a chart's series when avoiding adjacent collisions.
   */
  chartUuid?: string
}): string => {
  let theme: 'light' | 'dark' = 'light'
  if (hasInjectionContext()) {
    const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))
    theme = activeColorMode.value
  }

  // if discriminator is defined, always use it.
  if (discriminator !== undefined) {
    return colorByDiscriminator({
      discriminator,
      theme,
      customPalette,
    })
  }

  // state must be second as it's for handling specific cases regardless of data
  if (state !== undefined) {
    return colorByState({ state })
  }

  // a universal color override for any dimension value of 'empty'
  if (dimensionValue && ['empty', '____OTHER____'].includes(dimensionValue)) {
    return colorByState({ state: dimensionValue as ColorState })
  }

  // if we have specific overrides for this dimension
  if (dimension !== undefined && dimensionValue !== undefined) {
    if (dimension === 'status_code') {
      return colorByStatusCode({ statusCode: dimensionValue })
    }

    if (dimension === 'status_code_grouped') {
      return colorByStatusCodeGroup({ group: dimensionValue })
    }
  }

  // otherwise, generate a discriminator using the information we have
  if (dimension || dimensionValue || metric) {
    const name = `${dimension ?? ''}${dimensionValue ?? ''}${metric ?? ''}`
    const discriminatorValue = coordinator
      ? coordinator.resolveDiscriminator({ name, order, chartUuid, theme, customPalette })
      : generateDiscriminator(name)
    console.log(name, 'gets discriminator: ', discriminatorValue)
    return colorByDiscriminator({
      discriminator: discriminatorValue,
      theme,
      customPalette,
    })
  }

  // if we don't have any information, return our neutral color
  return colorByState({ state: 'neutral' })
}
