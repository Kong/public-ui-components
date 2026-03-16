import { computed, nextTick, ref, type Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useKeyValueField, type KeyValueFieldProps } from './useKeyValueField'

type StringRecord = Record<string, string>

const mocks = vi.hoisted(() => ({
  fieldValue: undefined as unknown as Ref<StringRecord | null>,
  emptyOrDefaultValue: undefined as unknown as Ref<StringRecord | null>,
  useAttrs: vi.fn(() => ({})),
}))

vi.mock('vue', async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importActual<typeof import('vue')>()

  return {
    ...actual,
    default: actual,
    useAttrs: mocks.useAttrs,
  }
})

vi.mock('../composables', () => ({
  useField: vi.fn(() => ({
    value: mocks.fieldValue,
    emptyOrDefaultValue: mocks.emptyOrDefaultValue,
    path: ref('test-path'),
    schema: computed(() => ({ type: 'record' })),
    hide: computed(() => false),
    ancestors: ref({ parent: null }),
    renderer: ref(null),
    error: null,
  })),
  useFieldAttrs: vi.fn(() => computed(() => ({ }))),
}))

const makeProps = (overrides: Partial<KeyValueFieldProps<string, string>> = {}): KeyValueFieldProps<string, string> => ({
  name: 'test-field',
  ...overrides,
})

const snapshotEntries = (entries: Array<{ id: string, key: string, value: string }>) => entries.map(({ key, value }) => ({ key, value }))

async function setup(
  overrides: Partial<KeyValueFieldProps<string, string>> = {},
  syncToFieldValue = true,
) {
  const emit = vi.fn()
  const result = useKeyValueField(makeProps(overrides), emit as never, syncToFieldValue)

  await nextTick()
  emit.mockClear()

  return {
    emit,
    ...result,
  }
}

describe('useKeyValueField', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fieldValue = ref<StringRecord | null>(null)
    mocks.emptyOrDefaultValue = ref<StringRecord | null>(null)
    mocks.useAttrs.mockReturnValue({})
  })

  describe('initialization', () => {
    it('initializes entries from initialValue', async () => {
      const { entries } = await setup({
        initialValue: { alpha: '1', beta: '2' },
      })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'alpha', value: '1' },
        { key: 'beta', value: '2' },
      ])
    })

    it('falls back to fieldValue when initialValue is undefined', async () => {
      mocks.fieldValue = ref({ alpha: '1', beta: '2' })

      const { entries } = await setup()

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'alpha', value: '1' },
        { key: 'beta', value: '2' },
      ])
    })

    it('prefers initialValue over fieldValue', async () => {
      mocks.fieldValue = ref({ field: 'from-field' })

      const { entries } = await setup({
        initialValue: { field: 'from-initial' },
      })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'field', value: 'from-initial' },
      ])
    })

    it('initializes empty entries from null', async () => {
      const { entries } = await setup({ initialValue: null })

      expect(entries.value).toEqual([])
    })

    it('initializes empty entries from undefined', async () => {
      const { entries } = await setup()

      expect(entries.value).toEqual([])
    })

    it('applies keyOrder during initialization', async () => {
      const { entries } = await setup({
        initialValue: { third: '3', first: '1', second: '2' },
        keyOrder: ['first', 'second', 'third'],
      })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'first', value: '1' },
        { key: 'second', value: '2' },
        { key: 'third', value: '3' },
      ])
    })
  })

  describe('addEntry', () => {
    it('adds an entry with empty key and value by default', async () => {
      const { addEntry, entries } = await setup()

      addEntry()

      expect(snapshotEntries(entries.value)).toEqual([{ key: '', value: '' }])
    })

    it('adds an entry with defaultKey and defaultValue', async () => {
      const { addEntry, entries } = await setup({
        defaultKey: 'api_key',
        defaultValue: 'secret',
      })

      addEntry()

      expect(snapshotEntries(entries.value)).toEqual([{ key: 'api_key', value: 'secret' }])
    })

    it('returns the created entry with a unique id', async () => {
      const { addEntry } = await setup()

      const first = addEntry()
      const second = addEntry()

      expect(first.id).toMatch(/^ff-kv-field-/)
      expect(second.id).toMatch(/^ff-kv-field-/)
      expect(first.id).not.toBe(second.id)
    })
  })

  describe('removeEntry', () => {
    it('removes an entry by id', async () => {
      const { entries, removeEntry } = await setup({
        initialValue: { alpha: '1', beta: '2' },
      })

      removeEntry(entries.value[0].id)

      expect(snapshotEntries(entries.value)).toEqual([{ key: 'beta', value: '2' }])
    })

    it('does nothing when the id does not exist', async () => {
      const { entries, removeEntry } = await setup({
        initialValue: { alpha: '1' },
      })

      removeEntry('missing-id')

      expect(snapshotEntries(entries.value)).toEqual([{ key: 'alpha', value: '1' }])
    })
  })

  describe('reset', () => {
    it('resets entries back to initialValue', async () => {
      const { entries, reset } = await setup({
        initialValue: { alpha: '1' },
      })

      entries.value[0].value = 'updated'
      entries.value.push({ id: 'extra', key: 'beta', value: '2' })

      reset()

      expect(snapshotEntries(entries.value)).toEqual([{ key: 'alpha', value: '1' }])
    })

    it('generates new ids after reset', async () => {
      const { entries, reset } = await setup({
        initialValue: { alpha: '1' },
      })
      const originalId = entries.value[0].id

      reset()

      expect(entries.value[0].id).not.toBe(originalId)
    })
  })

  describe('setValue', () => {
    it('sets entries from a record', async () => {
      const { entries, setValue } = await setup()

      setValue({ alpha: '1', beta: '2' })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'alpha', value: '1' },
        { key: 'beta', value: '2' },
      ])
    })

    it('sets entries to empty from null', async () => {
      const { entries, setValue } = await setup({
        initialValue: { alpha: '1' },
      })

      setValue(null)

      expect(entries.value).toEqual([])
    })
  })

  describe('entries to fieldValue sync', () => {
    it('syncs entries to fieldValue as a record', async () => {
      const { addEntry } = await setup()
      const entry = addEntry()

      entry.key = 'alpha'
      entry.value = '1'
      await nextTick()

      expect(mocks.fieldValue.value).toEqual({ alpha: '1' })
    })

    it('filters out entries with empty keys', async () => {
      const { addEntry } = await setup({
        initialValue: { alpha: '1' },
      })

      const emptyKeyEntry = addEntry()
      emptyKeyEntry.value = 'ignored'
      await nextTick()

      expect(mocks.fieldValue.value).toEqual({ alpha: '1' })
    })

    it('uses emptyOrDefaultValue when all entries are removed', async () => {
      mocks.emptyOrDefaultValue = ref({ fallback: 'value' })

      const { entries, removeEntry } = await setup({
        initialValue: { alpha: '1' },
      })

      removeEntry(entries.value[0].id)
      await nextTick()

      expect(mocks.fieldValue.value).toEqual({ fallback: 'value' })
    })

    it('does not overwrite an empty object fieldValue to null', async () => {
      mocks.fieldValue = ref({})

      const { emit } = await setup()

      expect(mocks.fieldValue.value).toEqual({})
      expect(emit).not.toHaveBeenCalled()
    })

    it('emits a change event with the new value', async () => {
      const { entries, emit } = await setup({
        initialValue: { alpha: '1' },
      })

      entries.value[0].value = '2'
      await nextTick()

      expect(emit).toHaveBeenCalledWith('change', { alpha: '2' })
    })

    it('does not sync when syncToFieldValue is false', async () => {
      const { addEntry, emit } = await setup({}, false)
      const entry = addEntry()

      entry.key = 'alpha'
      entry.value = '1'
      await nextTick()

      expect(mocks.fieldValue.value).toBeNull()
      expect(emit).not.toHaveBeenCalled()
    })
  })

  describe('fieldValue to entries sync', () => {
    it('preserves entry ids for existing keys', async () => {
      const { entries } = await setup({
        initialValue: { alpha: '1', beta: '2' },
      })
      const alphaId = entries.value.find(entry => entry.key === 'alpha')!.id

      mocks.fieldValue.value = { alpha: '10', gamma: '3' }
      await nextTick()

      expect(entries.value.find(entry => entry.key === 'alpha')!.id).toBe(alphaId)
      expect(entries.value.find(entry => entry.key === 'alpha')!.value).toBe('10')
    })

    it('creates new ids for new keys', async () => {
      const { entries } = await setup({
        initialValue: { alpha: '1' },
      })
      const existingIds = new Set(entries.value.map(entry => entry.id))

      mocks.fieldValue.value = { alpha: '1', beta: '2' }
      await nextTick()

      const betaEntry = entries.value.find(entry => entry.key === 'beta')
      expect(betaEntry).toBeDefined()
      expect(existingIds.has(betaEntry!.id)).toBe(false)
    })

    it('removes entries for deleted keys', async () => {
      const { entries } = await setup({
        initialValue: { alpha: '1', beta: '2' },
      })

      mocks.fieldValue.value = { beta: '2' }
      await nextTick()

      expect(snapshotEntries(entries.value)).toEqual([{ key: 'beta', value: '2' }])
    })

    it('applies keyOrder when updating entries', async () => {
      const { entries } = await setup({
        keyOrder: ['beta', 'alpha', 'gamma'],
      })

      mocks.fieldValue.value = { alpha: '1', gamma: '3', beta: '2' }
      await nextTick()

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'beta', value: '2' },
        { key: 'alpha', value: '1' },
        { key: 'gamma', value: '3' },
      ])
    })

    it('clears entries when fieldValue becomes null', async () => {
      const { entries } = await setup({
        initialValue: { alpha: '1' },
      })

      mocks.fieldValue.value = null
      await nextTick()

      expect(entries.value).toEqual([])
    })

    it('does not re-trigger on the same value', async () => {
      const { addEntry, entries } = await setup({
        initialValue: { alpha: '1' },
      })

      addEntry()
      await nextTick()
      expect(entries.value).toHaveLength(2)

      mocks.fieldValue.value = { alpha: '1' }
      await nextTick()

      expect(entries.value).toHaveLength(2)
      expect(entries.value[1].key).toBe('')
    })
  })

  describe('keyOrder', () => {
    it('sorts entries when all keys are covered by keyOrder', async () => {
      const { entries } = await setup({
        initialValue: { c: '3', a: '1', b: '2' },
        keyOrder: ['a', 'b', 'c'],
      })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
        { key: 'c', value: '3' },
      ])
    })

    it('puts unordered keys after ordered keys', async () => {
      const { entries } = await setup({
        initialValue: { extra: '3', beta: '2', alpha: '1' },
        keyOrder: ['alpha', 'beta'],
      })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'alpha', value: '1' },
        { key: 'beta', value: '2' },
        { key: 'extra', value: '3' },
      ])
    })

    it('overrides numeric-looking key ordering with keyOrder', async () => {
      const { entries } = await setup({
        initialValue: { 2: 'two', 10: 'ten', 1: 'one' },
        keyOrder: ['10', '2', '1'],
      })

      expect(snapshotEntries(entries.value)).toEqual([
        { key: '10', value: 'ten' },
        { key: '2', value: 'two' },
        { key: '1', value: 'one' },
      ])
    })
  })

  describe('edge cases', () => {
    it('uses the last value for duplicate keys when syncing to fieldValue', async () => {
      const { addEntry } = await setup()
      const first = addEntry()
      const second = addEntry()

      first.key = 'alpha'
      first.value = '1'
      second.key = 'alpha'
      second.value = '2'
      await nextTick()

      expect(mocks.fieldValue.value).toEqual({ alpha: '2' })
    })

    it('keeps empty-key entries in entries while excluding them from fieldValue', async () => {
      const { addEntry, entries } = await setup({
        initialValue: { alpha: '1' },
      })

      const invalidEntry = addEntry()
      invalidEntry.value = 'ignored'
      await nextTick()

      expect(snapshotEntries(entries.value)).toEqual([
        { key: 'alpha', value: '1' },
        { key: '', value: 'ignored' },
      ])
      expect(mocks.fieldValue.value).toEqual({ alpha: '1' })
    })
  })
})
