import type { GranularityKeys } from '.'

export interface ITimeframe {
  readonly timeframeText: string;
  readonly key: string;
  readonly display: string;
  readonly timeframeLength: () => number;
  readonly allowedTiers: Array<string>;
  readonly defaultResponseGranularity: GranularityKeys;
  readonly dataGranularity: GranularityKeys;
  readonly isRelative: boolean;
  rawEnd(_tz?: string): Date;
  rawStart(_tz?: string): Date;
  timeframeLengthMs(): number;
  maximumTimeframeLength(): number;
  allowedGranularities(): Set<GranularityKeys>;
}
