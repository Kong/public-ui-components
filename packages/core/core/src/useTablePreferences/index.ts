import { USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY, DEFAULT_USER_TABLE_PREFERENCES } from '../constants'
import type { UserTablePreferences } from './types'

export default function useTablePreferences() {
  /**
   * Attempt to parse a JSON string
   * @private
   * @param {string | null} jsonString The JSON string to parse
   * @returns {Record<string, any> | undefined} JavaScript Object
   */
  const tryParseJson = (jsonString: string | null): Record<string, any> | undefined => {
    if (typeof jsonString !== 'string') {
      return undefined
    }

    try {
      return JSON.parse(jsonString)
    } catch (err: any) {
      console.error('useTablePreferences(tryParseJson)', err)

      return undefined
    }
  }

  /**
   * Get any stored table preferences from localStorage and return them in a JavaScript Map
   * @private
   * @returns {Map<string, Record<string, any>>}
   */
  const getAllTablePreferences = (): Map<string, Record<string, any>> => {
    const existingPreferences = tryParseJson(localStorage.getItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY))

    if (!existingPreferences || !Object.keys(existingPreferences).length) {
      return new Map()
    }

    // Load the existing preferences into a Map()
    return new Map<string, Record<string, any>>(Object.entries(existingPreferences))
  }

  /**
   * Store the preferences for a table, by unique id string, to localStorage for persistence
   * @param {string} tableKey The table identifier
   * @param {UserTablePreferences} newPreferences The table preferences object to store
   */
  const setTablePreferences = (tableKey: string, newPreferences: UserTablePreferences): void => {
    // Wrap in a try/catch in case localStorage is full
    try {
      const existingPreferencesMap = getAllTablePreferences()

      // Save the new preference
      existingPreferencesMap.set(tableKey, newPreferences)

      localStorage.setItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY, JSON.stringify(Object.fromEntries(existingPreferencesMap.entries())))
    } catch (err) {
      console.error('useTablePreferences(setTablePreferences)', err)
    }
  }

  /**
   * Retrieve the stored table preferences for a table, by unique id string. Fallback to the default table preferences
   * @param {string} tableKey The table identifier
   * @returns {UserTablePreferences} The stored preferences for the given tableKey
   */
  const getTablePreferences = (tableKey: string): UserTablePreferences => {
    const existingPreferences = getAllTablePreferences()

    const tablePreferences = existingPreferences?.get(tableKey) || undefined

    // return the stored preferences, or fallback to DEFAULT_USER_TABLE_PREFERENCES if the tableKey does not exist
    return tablePreferences || DEFAULT_USER_TABLE_PREFERENCES
  }

  /**
   * Delete any stored table preferences from localStorage
   */
  const deleteAllTablePreferences = (): void => {
    localStorage.removeItem(USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY)
  }

  return {
    setTablePreferences,
    getTablePreferences,
    deleteAllTablePreferences,
  }
}
