// FetcherRawResponse is the raw format of the endpoint's response
export type Consumer = (
  | {
    username: string;
    custom_id?: string;
  }
  | {
    username?: string;
    custom_id: string;
  }
) & {
  id: string;
  tags?: string[];
};

export interface FetcherRawResponse<T = any> {
  data: T[];
  total: number;
  offset?: string;
}

export const consumers5: Consumer[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    username: `consumer.${i + 1}`,
    custom_id: `consumer-${i + 1}`,
  }))

export const consumers100: Consumer[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    username: `consumer.${i + 1}`,
    custom_id: `consumer-${i + 1}`,
  }))

export const paginate = (
  consumers: Consumer[],
  size: number,
  _offset: number,
): FetcherRawResponse<Consumer> => {
  const sliced = consumers.slice(_offset, _offset + size)
  const offset =
    _offset + size < consumers.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}
