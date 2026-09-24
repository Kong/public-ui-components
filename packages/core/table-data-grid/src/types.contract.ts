// Compile-time checks for valid/default mode-input pairs and rejected incompatible pairs; no runtime test.
import type {
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridProps,
} from './types'

type TestRow = {
  id: string
}

type Expect<T extends true> = T

const headers: Array<TableDataGridHeader<TestRow>> = [{ key: 'id', label: 'ID' }]
const infiniteFetcher: TableDataGridFetcher<TestRow> = async ({ mode, pageSize }) => ({
  data: [{ id: `${mode}-${pageSize}` }],
})
const rows: TestRow[] = [{ id: 'row' }]

const validProps: Array<TableDataGridProps<TestRow>> = [
  { fetcher: infiniteFetcher, headers },
  { fetcher: infiniteFetcher, headers, mode: 'infinite', pageSize: 10, refreshKey: 1 },
  { rows, headers, mode: 'unpaginated' },
]

type RejectsInvalidProps<Props> = Props extends TableDataGridProps<TestRow> ? false : true
const invalidModeChecks: [
  fetcherInUnpaginatedMode: Expect<RejectsInvalidProps<{
    fetcher: TableDataGridFetcher<TestRow>
    headers: typeof headers
    mode: 'unpaginated'
  }>>,
  rowsWithoutMode: Expect<RejectsInvalidProps<{
    rows: TestRow[]
    headers: typeof headers
  }>>,
  rowsInInfiniteMode: Expect<RejectsInvalidProps<{
    rows: TestRow[]
    headers: typeof headers
    mode: 'infinite'
  }>>,
  pageSizeInUnpaginatedMode: Expect<RejectsInvalidProps<{
    rows: TestRow[]
    headers: typeof headers
    mode: 'unpaginated'
    pageSize: number
  }>>,
] = [true, true, true, true]

void validProps
void invalidModeChecks
