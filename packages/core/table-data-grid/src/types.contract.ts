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
