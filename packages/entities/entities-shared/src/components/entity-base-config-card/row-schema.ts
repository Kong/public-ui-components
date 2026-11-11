import type { InjectionKey } from 'vue'
import type { RecordItem } from '../../types'

/**
 * Resolves the API schema of the record a row's value comes from: the root record, or the
 * Plugin or Policy record. Returns `undefined` for rows the View did not build, which keep the
 * schema provided above them. Provided by `EntityConfigCardView`; never part of a public API.
 */
export const CONFIG_CARD_ROW_SCHEMA: InjectionKey<(row: RecordItem) => { schema?: Record<string, any> } | undefined> = Symbol('config-card-row-schema')
