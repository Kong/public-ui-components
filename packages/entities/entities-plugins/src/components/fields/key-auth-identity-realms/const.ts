import type { InjectionKey, Ref } from 'vue'
import type { MultiselectItem } from '@kong/kongponents'

export const FETCHED_REALMS_KEY: InjectionKey<Ref<MultiselectItem[]>> = Symbol('fetched-realms')
