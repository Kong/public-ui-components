export * from './types'
export * from './string'
export * from './number'
export * from './boolean'
export * from './enum'
export * from './tag'
export * from './array'
export * from './record'
export * from './map'
export * from './json'
export * from './foreign'
export * from './expression'

import { fillString } from './string'
import { fillNumber } from './number'
import { fillBoolean } from './boolean'
import { fillEnum } from './enum'
import { fillTag } from './tag'
import { fillArray } from './array'
import { fillRecord } from './record'
import { fillMap } from './map'
import { fillJson } from './json'
import { fillForeign } from './foreign'
import { fillExpression } from './expression'

export const handlers = {
  fillString,
  fillNumber,
  fillBoolean,
  fillEnum,
  fillTag,
  fillArray,
  fillRecord,
  fillMap,
  fillJson,
  fillForeign,
  fillExpression,
}

export type Handlers = typeof handlers
