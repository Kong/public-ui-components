export interface ForeignCompletionItem {
  id: string
  label: string
}

export type ForeignCompletionFetcher<T extends ForeignCompletionItem = ForeignCompletionItem> = (params: any) => Promise<T[]>

export type ForeignCompletionFetchers = Record<string, ForeignCompletionFetcher>
