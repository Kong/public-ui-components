// Compile-time checks for valid/default mode-fetcher pairs and rejected incompatible pairs; no runtime test.
import type {
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridProps,
  TableDataGridUnpaginatedFetcher,
} from './types'

type TestRow = {
  id: string
}

type Expect<T extends true> = T

const headers: Array<TableDataGridHeader<TestRow>> = [{ key: 'id', label: 'ID' }]
const infiniteFetcher: TableDataGridFetcher<TestRow> = async ({ mode, pageSize }) => ({
  data: [{ id: `${mode}-${pageSize}` }],
})
const unpaginatedFetcher: TableDataGridUnpaginatedFetcher<TestRow> = async ({ mode }) => ({
  data: [{ id: mode }],
})

const validProps: Array<TableDataGridProps<TestRow>> = [
  { fetcher: infiniteFetcher, headers },
  { fetcher: infiniteFetcher, headers, mode: 'infinite' },
  { fetcher: unpaginatedFetcher, headers, mode: 'unpaginated' },
]

type RejectsInvalidProps<Props> = Props extends TableDataGridProps<TestRow> ? false : true
const invalidModeChecks: [
  infiniteFetcherInUnpaginatedMode: Expect<RejectsInvalidProps<{
    fetcher: TableDataGridFetcher<TestRow>
    headers: typeof headers
    mode: 'unpaginated'
  }>>,
  unpaginatedFetcherWithoutMode: Expect<RejectsInvalidProps<{
    fetcher: TableDataGridUnpaginatedFetcher<TestRow>
    headers: typeof headers
  }>>,
  unpaginatedFetcherInInfiniteMode: Expect<RejectsInvalidProps<{
    fetcher: TableDataGridUnpaginatedFetcher<TestRow>
    headers: typeof headers
    mode: 'infinite'
  }>>,
] = [true, true, true]

void validProps
void invalidModeChecks

const numericHeader: TableDataGridHeader<{ count: number }> = {
  key: 'count',
  label: 'Requests',
  dataType: 'number',
  showPercentage: true,
  bar: 'absolute',
  thresholds: [{ value: 100, type: 'warning' }],
  valueFormatter: (_value, row) => `${row.count} requests`,
  percentageFormatter: percentage => `${percentage}%`,
  icons: [{ pattern: /openai/i, icon: { render: () => null } }],
}
type RejectUnknownBar = Expect<'max' extends NonNullable<TableDataGridHeader['bar']> ? false : true>
type RejectStringPattern = Expect<string extends NonNullable<TableDataGridHeader['icons']>[number]['pattern'] ? false : true>
const rejectUnknownBar: RejectUnknownBar = true
const rejectStringPattern: RejectStringPattern = true
void numericHeader
void rejectUnknownBar
void rejectStringPattern
