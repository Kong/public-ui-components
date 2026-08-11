import { uniqueId } from 'lodash-es'

const ID_PREFIX = '__request_callout_'

export function getCalloutId(): string {
  return uniqueId(ID_PREFIX)
}
