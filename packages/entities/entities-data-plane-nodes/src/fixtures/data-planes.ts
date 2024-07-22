import { v4 as uuidv4 } from 'uuid'
import type { DataPlaneNodeCommon } from '../types'

export const mockDataPlane = (): DataPlaneNodeCommon => {
  const id = uuidv4()
  return { id, hostname: id.substring(0, id.indexOf('-')) }
}
