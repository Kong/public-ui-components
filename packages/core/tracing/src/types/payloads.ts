export type Headers = Record<string, string>
export type Body = string

export type Payload =
  | {
    type: 'headers';
    headers: Headers;
  }
  | {
    type: 'body';
    content: Body;
  }
