import type { FlameChartNode, FlatTreeNode, Mark, WaterfallItem } from '@kong/flame-chart-js'

export type NodeTypes =
  | { node: FlatTreeNode | null; type: 'flame-chart-node' }
  | { node: WaterfallItem | null; type: 'waterfall-node' }
  | { node: Mark | null; type: 'mark' }
  | null;

export interface ExtendedFlameNode extends FlameChartNode {
  children: ExtendedFlameNode[];

  // Internal use only
  internals: {
    root?: boolean;
    children: { [name: string]: ExtendedFlameNode };
    depth: number;
    selfDuration: number;
    totalDuration?: number;
    parent?: ExtendedFlameNode;
  }
}
