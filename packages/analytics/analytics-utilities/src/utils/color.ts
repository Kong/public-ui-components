import { djb2 } from './djb2'
import {
  statusCodeColors,
  statusCodeGroupColors,
  unknownStatusCodeColors,
  stateColors,
  type ColorState,
} from './color-overrides'
import { KUI_COLOR_BACKGROUND_NEUTRAL } from '@kong/design-tokens'

// https://supercolorpalette.com/ is a nice tool for generating these
export const lightPalette = [
  '#1693AE',
  '#2EA697',
  '#5CB56C',
  '#AD47F1',
  '#7287F1',
  '#4DA8DF',
  '#DA5024',
  '#EC4D87',
  '#D771D5',
  '#6C931E',
  '#AC8E26',
  '#DB8743',
]

export const darkPalette = [
  '#006B74',
  '#187C62',
  '#538732',
  '#7201DE',
  '#1E63D3',
  '#1E83A3',
  '#B2001F',
  '#BA107B',
  '#A739D0',
  '#5E6400',
  '#8B620C',
  '#BB5420',
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
