import { FIELD_STATES } from '../const'

import type { SelectItem } from '@kong/kongponents'
import type { EntityData } from '../types/form-autosuggest'

export const defaultItemTransformer = (item: EntityData): SelectItem<string> => {
  return {
    ...item,
    label: item.name,
    value: item.id,
  }
}

/**
 * 1. Look up current state using current model and entity from router (if exists)
 * 2. If Updating, look up object from ID
 * 3. If Creating & from referral (ie. service -> route) set value with entity object from params
 * TODO: mark model to a specific type when we can.
 * @returns {Object} Object to set current search text
 */
export function getFieldState(model: any, associatedEntity: boolean, bypassSearch: boolean): typeof FIELD_STATES[keyof typeof FIELD_STATES] {
  if (bypassSearch) {
    return FIELD_STATES.SET_REFERRAL_VALUE
  } else if ((model && !associatedEntity) || (!model && associatedEntity)) {
    return FIELD_STATES.UPDATE_ENTITY
  } else if (model && associatedEntity) {
    return FIELD_STATES.CREATE_FROM_ENTITY
  }

  return FIELD_STATES.CREATE_NOT_FROM_ENTITY
}
