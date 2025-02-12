export type Direction = 'request' | 'response'
export type Headers = Record<string, string>
export type Body = string

export type Payload = {
  direction: Direction;
} & (
  | {
    type: 'headers';
    headers: Headers;
  }
  | {
    type: 'body';
    content: Body;
  }
)
