import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { createI18n } from '@kong-ui-public/i18n'
import { OpenAiIcon } from '@kong/icons'
import { describe, expect, it } from 'vitest'
import english from '../locales/en.json'
import {
  createTopNGridRows,
  createTopNPresentation,
  getColumnOptions,
  getTopNProviderIcon,
  toNumber,
} from './topn-columns'

const i18n = createI18n<typeof english>('en-us', english)
describe('TopN column calculations', () => {
  it('resolves options case-insensitively', () => {
    expect(
      getColumnOptions(
        { REQUEST_COUNT: { label: 'Requests' } },
        'request_count',
      )?.label,
    ).toBe('Requests')
  })

  it.each([
    [12, 12],
    ['3.5', 3.5],
    [null, null],
    [undefined, null],
    ['', null],
    ['invalid', null],
  ])('converts %s to %s', (input, expected) => {
    expect(toNumber(input)).toBe(expected)
  })
})

describe('createTopNPresentation', () => {
  const data: ExploreResultV4 = {
    meta: {
      display: {
        ROUTE: { route1: { name: 'Route 1' }, route2: { name: 'Deleted route', deleted: true } },
        GATEWAY_SERVICE: { service1: { name: 'Service 1' } },
      },
      metric_names: ['REQUEST_COUNT', '4XX'],
      metric_units: { REQUEST_COUNT: 'count', '4XX': 'count' },
      start: '', end: '', granularity_ms: 1, query_id: '',
    },
    data: [
      { event: { ROUTE: 'route1', GATEWAY_SERVICE: 'service1', REQUEST_COUNT: 75, '4XX': 5 }, timestamp: '' },
      { event: { ROUTE: 'route2', GATEWAY_SERVICE: 'service1', REQUEST_COUNT: 25, '4XX': 1 }, timestamp: '' },
    ],
  }

  it('selects provider icons from opted-in raw ids only', () => {
    const columnOptions = { AI_PROVIDER: { icon_set: 'ai_provider' as const } }

    expect(getTopNProviderIcon({ columnOptions, columnKey: 'ai_provider', rawValue: 'OpenAI' })).toBe(OpenAiIcon)
    expect(getTopNProviderIcon({ columnOptions, columnKey: 'ai_provider', rawValue: 'openai-proxy' })).toBeUndefined()
    expect(getTopNProviderIcon({ columnOptions, columnKey: 'route', rawValue: 'openai' })).toBeUndefined()
  })

  it('preserves dimension/metric order and maps rows against the full result', () => {
    const rows = createTopNGridRows(data)
    const presentation = createTopNPresentation({
      data,
      columnOptions: {
        REQUEST_COUNT: { value: 'relative', bar: 'max' },
      },
      i18n,
    })

    expect(presentation.headers.map((header) => header.key)).toEqual(['ROUTE', 'GATEWAY_SERVICE', 'REQUEST_COUNT', '4XX'])
    expect(rows.map(row => row.ROUTE)).toEqual(['route1', 'route2'])
    expect(presentation.getDimension(rows[1], 'ROUTE')).toEqual({
      id: 'route2',
      label: 'Deleted route',
      deleted: true,
    })
    expect(rows.map(row => row.REQUEST_COUNT)).toEqual([75, 25])
    expect(presentation.headers.find(header => header.key === 'REQUEST_COUNT')?.valueFormatter?.(rows[0].REQUEST_COUNT, rows[0])).toBe('75 ')
    expect(presentation.headers[2]).toMatchObject({
      dataType: 'number', showPercentage: true, bar: 'absolute',
    })
    expect(presentation.headers[2].percentageFormatter?.(0.001)).toBe('< 0.01 %')
  })

  it('normalizes numeric metric values for the grid without changing the Explore records', () => {
    const numericData = {
      ...data,
      data: [{ timestamp: '', event: { ROUTE: 'route1', REQUEST_COUNT: '25', '4XX': null } }],
    }
    const [row] = createTopNGridRows(numericData)

    expect(row).toMatchObject({ REQUEST_COUNT: 25, '4XX': null })
    expect(row.record).toBe(numericData.data[0])
    expect(row.record.event.REQUEST_COUNT).toBe('25')
  })

  it.each([[1, '1 millisecond'], [2, '2 milliseconds']] as const)('formats translated units for %s', (value, expected) => {
    const unitData: ExploreResultV4 = {
      ...data,
      data: [{ timestamp: '', event: { REQUEST_COUNT: value } }],
      meta: { ...data.meta, metric_names: ['REQUEST_COUNT'], metric_units: { REQUEST_COUNT: 'ms' } },
    }
    const translatedI18n = createI18n('en-us', {
      ...english,
      chartUnits: { ...english.chartUnits, ms: 'millisecond{plural}' },
    })
    const presentation = createTopNPresentation({ data: unitData, i18n: translatedI18n })
    const [row] = createTopNGridRows(unitData)

    expect(presentation.headers.find(header => header.key === 'REQUEST_COUNT')?.valueFormatter?.(value, row)).toBe(expected)
  })

  it('retains empty and missing dimension values for slot consumers', () => {
    const emptyData = {
      ...data,
      data: [
        { event: { ROUTE: 'empty', REQUEST_COUNT: null }, timestamp: '' },
      ],
    }
    const rows = createTopNGridRows(emptyData)
    const presentation = createTopNPresentation({ data: emptyData, i18n })

    expect(
      presentation.getDimension(rows[0], 'ROUTE'),
    ).toMatchObject({
      id: 'empty',
      label: '-',
      deleted: false,
    })
    expect(presentation.headers.find(header => header.key === 'REQUEST_COUNT')?.valueFormatter?.(rows[0].REQUEST_COUNT, rows[0])).toBe('–')
  })

  it('translates lowercase dimensions and preserves custom labels with renderer i18n', () => {
    const lowercaseData: ExploreResultV4 = {
      ...data,
      data: [{
        event: { consumer_group: 'group-1', principal: 'principal-1', REQUEST_COUNT: 3 },
        timestamp: '',
      }],
      meta: {
        ...data.meta,
        display: { consumer_group: { 'group-1': { name: 'Group 1' } }, principal: { 'principal-1': { name: 'Principal 1' } } },
        metric_names: ['REQUEST_COUNT'],
        metric_units: { REQUEST_COUNT: 'count' },
      },
    }

    const translated = createTopNPresentation({ data: lowercaseData, i18n })
    const custom = createTopNPresentation({
      data: lowercaseData,
      columnOptions: {
        consumer_group: { label: 'Group' },
        principal: { label: 'Identity' },
        REQUEST_COUNT: { label: 'Requests' },
      },
      i18n,
    })

    expect(translated.headers.map((header) => header.label)).toEqual(['Consumer group', 'Principal', 'Request count'])
    expect(custom.headers.map((header) => header.label)).toEqual(['Group', 'Identity', 'Requests'])
  })
})
