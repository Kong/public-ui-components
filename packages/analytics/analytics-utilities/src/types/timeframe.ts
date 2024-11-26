import type { GranularityValues } from '.'

export interface ITimeframe {
  readonly timeframeText: string;
  readonly key: string;
  readonly display: string;
  readonly timeframeLength: () => number;
  readonly allowedTiers: Array<string>;
  readonly defaultResponseGranularity: GranularityValues;
  readonly dataGranularity: GranularityValues;
  readonly isRelative: boolean;
  rawEnd(_tz?: string): Date;
  rawStart(_tz?: string): Date;
  timeframeLengthMs(): number;
  maximumTimeframeLength(): number;
  allowedGranularities(fineGrain?: boolean): Set<GranularityValues>;
}
