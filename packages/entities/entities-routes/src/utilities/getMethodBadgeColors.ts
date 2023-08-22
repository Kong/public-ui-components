import type { Method, MethodBadgeColors } from '../types'

type DefinedMethod = Exclude<Method, 'CUSTOM'>

const colorMap: Record<DefinedMethod | 'DEFAULT', MethodBadgeColors> = {
  GET: {
    color: '#0364AC',
    backgroundColor: '#F2F6FE',
  },
  DELETE: {
    color: '#922021',
    backgroundColor: '#FFDEDE',
  },
  POST: {
    color: '#13755E',
    backgroundColor: '#E8F8F5',
  },
  PATCH: {
    color: '#006E9D',
    backgroundColor: '#CDF1FE',
  },
  PUT: {
    color: '#A05604',
    backgroundColor: '#FFF3D8',
  },
  OPTIONS: {
    color: '#273C61',
    backgroundColor: '#DAE3F2',
  },
  HEAD: {
    color: '#A05604',
    backgroundColor: '#FFE6BA',
  },
  CONNECT: {
    color: '#473CFB',
    backgroundColor: '#D7D8FE',
  },
  TRACE: {
    color: '#FFFFFF',
    backgroundColor: '#5C7299',
  },
  DEFAULT: {
    color: '#FFFFFF',
    backgroundColor: '#5C7299',
  },
}

export const getMethodBadgeColors = (method: DefinedMethod): MethodBadgeColors => {
  return colorMap[method] ?? colorMap.DEFAULT
}
