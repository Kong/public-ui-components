import { describe, it, expect, afterEach } from 'vitest'
import useTablePreferences from './index'
import { USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY, DEFAULT_USER_TABLE_PREFERENCES } from '../constants'

describe('useTablePreferences', () => {

  afterEach(() => {
    // Clear localStorage values after each test
    localStorage.removeItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)
  })

  it('stores preferences under the correct storage key', () => {
    const tableKey = 'my-table-key'
    const userPrefs = {
      pageSize: 36,
      sortColumnKey: 'id',
      sortColumnOrder: 'desc',
    }
    const { setTablePreferences } = useTablePreferences()

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).toEqual(null)

    setTablePreferences(tableKey, {
      pageSize: userPrefs.pageSize,
      sortColumnKey: userPrefs.sortColumnKey,
      sortColumnOrder: userPrefs.sortColumnOrder as 'asc' | 'desc',
    })

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).not.toEqual(null)
  })

  it('properly stores and retrieves user table preferences under the correct storage key', () => {
    const tableKey = 'my-table-key'
    const userPrefs = {
      pageSize: 36,
      sortColumnKey: 'id',
      sortColumnOrder: 'desc',
    }
    const { setTablePreferences, getTablePreferences } = useTablePreferences()

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).toEqual(null)

    setTablePreferences(tableKey, {
      pageSize: userPrefs.pageSize,
      sortColumnKey: userPrefs.sortColumnKey,
      sortColumnOrder: userPrefs.sortColumnOrder as 'asc' | 'desc',
    })

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).not.toEqual(null)

    const { pageSize, sortColumnKey, sortColumnOrder } = getTablePreferences(tableKey)

    expect(pageSize).toEqual(userPrefs.pageSize)
    expect(sortColumnKey).toEqual(userPrefs.sortColumnKey)
    expect(sortColumnOrder).toEqual(userPrefs.sortColumnOrder)
  })

  it('properly stores and retrieves MULTIPLE user table preferences under the correct storage key', () => {
    const tableKey1 = 'my-table-key-one'
    const tableKey2 = 'my-table-key-two'
    const userPrefs1 = {
      pageSize: 36,
      sortColumnKey: 'id',
      sortColumnOrder: 'desc',
    }
    const userPrefs2 = {
      pageSize: 45,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
    }
    const { setTablePreferences, getTablePreferences } = useTablePreferences()

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).toEqual(null)

    setTablePreferences(tableKey1, {
      pageSize: userPrefs1.pageSize,
      sortColumnKey: userPrefs1.sortColumnKey,
      sortColumnOrder: userPrefs1.sortColumnOrder as 'asc' | 'desc',
    })

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).not.toEqual(null)

    setTablePreferences(tableKey2, {
      pageSize: userPrefs2.pageSize,
      sortColumnKey: userPrefs2.sortColumnKey,
      sortColumnOrder: userPrefs2.sortColumnOrder as 'asc' | 'desc',
    })

    // Table 1
    const tablePrefs1 = getTablePreferences(tableKey1)

    expect(tablePrefs1.pageSize).toEqual(userPrefs1.pageSize)
    expect(tablePrefs1.sortColumnKey).toEqual(userPrefs1.sortColumnKey)
    expect(tablePrefs1.sortColumnOrder).toEqual(userPrefs1.sortColumnOrder)

    // Table 2
    const tablePrefs2 = getTablePreferences(tableKey2)

    expect(tablePrefs2.pageSize).toEqual(userPrefs2.pageSize)
    expect(tablePrefs2.sortColumnKey).toEqual(userPrefs2.sortColumnKey)
    expect(tablePrefs2.sortColumnOrder).toEqual(userPrefs2.sortColumnOrder)

    // Compare both tables to ensure they are different
    expect(tablePrefs1.pageSize).not.toEqual(tablePrefs2.pageSize)
    expect(tablePrefs1.sortColumnKey).not.toEqual(tablePrefs2.sortColumnKey)
    expect(tablePrefs1.sortColumnOrder).not.toEqual(tablePrefs2.sortColumnOrder)
  })

  it('falls back to the default preferences if the tableKey does not exist', () => {
    const { getTablePreferences } = useTablePreferences()

    const tablePreferences = getTablePreferences('my-fake-table-key')

    expect(tablePreferences).toEqual(DEFAULT_USER_TABLE_PREFERENCES)
  })

  it('deletes user preferences from localStorage with the `deleteAllTablePreferences` method', () => {
    const tableKey = 'fake-table-key'
    const userPrefs = {
      pageSize: 36,
      sortColumnKey: 'id',
      sortColumnOrder: 'desc',
    }
    const { setTablePreferences, deleteAllTablePreferences } = useTablePreferences()

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).toEqual(null)

    setTablePreferences(tableKey, {
      pageSize: userPrefs.pageSize,
      sortColumnKey: userPrefs.sortColumnKey,
      sortColumnOrder: userPrefs.sortColumnOrder as 'asc' | 'desc',
    })

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).not.toEqual(null)

    deleteAllTablePreferences()

    expect(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)).toEqual(null)
  })
})
