import type { IEvent, IKeyValue, IStatus } from '@opentelemetry/otlp-transformer'

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  attributes: IKeyValue[];
  droppedAttributesCount: number;
  status: IStatus;
  events?: Event[];
}

export interface Event extends IEvent {
  timeUnixNano: number;
}

export interface SpanNode {
  span: Span;
  root?: boolean;
  durationNano: number;
  parent?: SpanNode;
  children: SpanNode[];
}

interface AttributeSchema {
  name: string;
  type: string;
}

export interface SpanAttributeSchema extends AttributeSchema {
  alias?: string
  useForSampling?: boolean
}

export type SpanEventAttributeSchema = AttributeSchema
