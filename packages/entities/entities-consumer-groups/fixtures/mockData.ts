// FetcherRawResponse is the raw format of the endpoint's response
import { Consumer } from '../src'

export type ConsumerGroup = {
  name: string;
  consumers_count?: number;
  id: string;
  tags?: string[];
};

export interface FetcherRawResponse<T = any> {
  data: T[];
  total: number;
  offset?: string;
}

export const consumerGroups5: ConsumerGroup[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `consumerGroup.${i + 1}`,
    consumers_count: i * 10,
  }))

export const consumerGroups100: ConsumerGroup[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `consumerGroup.${i + 1}`,
    consumers_count: i * 2,
  }))

export const paginate = (
  consumerGroups: ConsumerGroup[],
  size: number,
  _offset: number,
): FetcherRawResponse<ConsumerGroup> => {
  const sliced = consumerGroups.slice(_offset, _offset + size)
  const offset =
    _offset + size < consumerGroups.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

export const consumersList5: Consumer[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    created_at: i + 123456,
    id: `${i + 1}`,
    tags: [`tag_${i}`],
    updated_at: i + 133345,
    username: `existingConsumer.${i + 1}`,
  }))

export const CreateConsumerGroupKonnectResponse: Record<string, object> = {
  item: {
    created_at: 1682620687,
    id: 'c0b7eac5-6b6d-48ad-bd0d-3253036cfebb',
    name: 'Test_999',
    updated_at: 1682620687,
  },
}

export const konnectGroup: Record<string, Record<string, any>> = {
  item: {
    created_at: 1682602931,
    id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
    name: 'Test_create_2',
    tags: ['tag1', 'tag5'],
    updated_at: 1682691637,
  },
}
export const CreateConsumerGroupKMResponse: Record<string, number| string> = {
  created_at: 1682620687,
  id: 'c0b7eac5-6b6d-48ad-bd0d-3253036cfebb',
  name: 'Test_999',
  updated_at: 1682620687,
}

export const KMGroup: Record<string, Record<string, any>> = {
  consumer_group: {
    created_at: 1682697358,
    id: '45e55c56-eaa2-4913-8d04-1074d50ea93e',
    name: 'Test',
    tags: ['tag 1'],
    updated_at: 1682697358,
  },
  consumers: [
    {
      created_at: 123457,
      id: '1',
      tags: ['tag_1'],
      updated_at: 133346,
      username: 'existingConsumer.1',
    },
  ],
}
export const KMGroup2: Record<string, Record<string, any>> = {
  consumer_group: {
    created_at: 1682697358,
    id: '45e55c56-eaa2-4913-8d04-1074d50ea93e',
    name: 'Test',
    tags: ['tag 1'],
    updated_at: 1682697358,
  },
  consumers: [
    {
      created_at: 123457,
      id: '1',
      tags: ['tag_1'],
      updated_at: 133346,
      username: 'existingConsumer.1',
    },
    {
      created_at: 123458,
      id: '2',
      tags: ['tag_2'],
      updated_at: 133347,
      username: 'existingConsumer.2',
    },
  ],
}
