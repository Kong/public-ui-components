import { djb2 } from './djb2'
import {
  statusCodeColors,
  statusCodeGroupColors,
  unknownStatusCodeColors,
  stateColors,
  type ColorState,
} from './color-overrides'
import { KUI_COLOR_BACKGROUND_NEUTRAL } from '@kong/design-tokens'

// Chart series 9 is reserved for empty values.
export const lightPalette = [
  '#0076F4',
  '#00819D',
  '#00A17B',
  '#8A50FF',
  '#FF3C99',
  '#FF395D',
  '#FF6D3C',
  '#B3A100',
  '#4E594E',
]

export const darkPalette = [
  '#5485BA',
  '#087D96',
  '#3D8776',
  '#7654BA',
  '#A1406F',
  '#953042',
  '#BF5430',
  '#B5A72C',
  '#4E594E',
]

export const generateDiscriminator = (id: string): number => djb2(id)

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
  theme = 'light',
  customPalette = undefined,
}: {
  discriminator?: number
  state?: ColorState
  dimension?: string
  dimensionValue?: string
  metric?: string
  theme?: 'light' | 'dark'
  customPalette?: string[]
}): string => {
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
    return colorByDiscriminator({
      discriminator: generateDiscriminator(`${dimension ?? ''}${dimensionValue ?? ''}${metric ?? ''}`),
      theme,
      customPalette,
    })
  }

  // if we don't have any information, return our neutral color
  return colorByState({ state: 'neutral' })
}
