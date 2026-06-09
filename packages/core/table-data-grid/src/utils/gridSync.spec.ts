import { describe, expect, it } from 'vitest'
import type { TableDataGridConfig } from '../types'
import {
  createLayoutSnapshot,
  createRefreshParamsForConfigChange,
  hasColumnVisibilityChanged,
  hasSelectionColumn,
} from './gridSync'

describe('grid sync utilities', () => {
  const baseConfig: TableDataGridConfig = {
    columnOrder: ['name', 'status'],
    columns: {
      name: { visible: true, width: 180, pinned: 'left' },
      status: { visible: true },
    },
    pageSize: 25,
    sortColumnKey: 'name',
    sortColumnOrder: 'asc',
  }

  it('creates layout-only config snapshots', () => {
    expect(createLayoutSnapshot(baseConfig)).toEqual({
      columnOrder: ['name', 'status'],
      columns: {
        name: { visible: true, width: 180, pinned: 'left' },
        status: { visible: true },
      },
      pageSize: undefined,
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
    })
  })

  it('creates refresh params only for fetch-affecting config changes', () => {
    expect(createRefreshParamsForConfigChange({
      mode: 'pagination',
      nextConfig: {
        ...baseConfig,
        pageSize: 50,
        sortColumnOrder: 'desc',
      },
      previousConfig: baseConfig,
    })).toEqual({
      pageSize: 50,
      sortColumnKey: 'name',
      sortColumnOrder: 'desc',
    })
    expect(createRefreshParamsForConfigChange({
      mode: 'infinite',
      nextConfig: {
        ...baseConfig,
        sortColumnOrder: 'desc',
      },
      previousConfig: baseConfig,
    })).toBeUndefined()
  })

  it('compares column visibility and row selection layout state', () => {
    expect(hasColumnVisibilityChanged({
      nextConfig: {
        ...baseConfig,
        columns: {
          ...baseConfig.columns,
          status: { visible: false },
        },
      },
      previousConfig: baseConfig,
    })).toBe(true)
    expect(hasSelectionColumn('multiple')).toBe(true)
    expect(hasSelectionColumn('single')).toBe(false)
    expect(hasSelectionColumn('none')).toBe(false)
  })
})
