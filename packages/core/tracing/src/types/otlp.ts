// DO NOT EDIT - Exported from @opentelemetry/otlp-transformer

/** Properties of an InstrumentationScope. */
export interface IInstrumentationScope {
  /** InstrumentationScope name */
  name: string;
  /** InstrumentationScope version */
  version?: string;
  /** InstrumentationScope attributes */
  attributes?: IKeyValue[];
  /** InstrumentationScope droppedAttributesCount */
  droppedAttributesCount?: number;
}
/** Properties of a KeyValue. */
export interface IKeyValue {
  /** KeyValue key */
  key: string;
  /** KeyValue value */
  value: IAnyValue;
}
/** Properties of an AnyValue. */
export interface IAnyValue {
  /** AnyValue stringValue */
  stringValue?: string | null;
  /** AnyValue boolValue */
  boolValue?: boolean | null;
  /** AnyValue intValue */
  intValue?: number | null;
  /** AnyValue doubleValue */
  doubleValue?: number | null;
  /** AnyValue arrayValue */
  arrayValue?: IArrayValue;
  /** AnyValue kvlistValue */
  kvlistValue?: IKeyValueList;
  /** AnyValue bytesValue */
  bytesValue?: Uint8Array;
}
/** Properties of an ArrayValue. */
export interface IArrayValue {
  /** ArrayValue values */
  values: IAnyValue[];
}
/** Properties of a KeyValueList. */
export interface IKeyValueList {
  /** KeyValueList values */
  values: IKeyValue[];
}
export interface LongBits {
  low: number;
  high: number;
}
export declare type Fixed64 = LongBits | string | number
export interface OtlpEncodingOptions {
  /** Convert trace and span IDs to hex strings. */
  useHex?: boolean;
  /** Convert HrTime to 2 part 64 bit values. */
  useLongBits?: boolean;
}
/** Properties of an Event. */
export interface IEvent {
  /** Event timeUnixNano */
  timeUnixNano: Fixed64;
  /** Event name */
  name: string;
  /** Event attributes */
  attributes: IKeyValue[];
  /** Event droppedAttributesCount */
  droppedAttributesCount: number;
}
