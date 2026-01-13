import type { InjectionKey } from 'vue'
import type { useSplitPane } from '../composable/useSplitPane'

export type SplitPaneState = ReturnType<typeof useSplitPane>

export const SplitPaneContextKey: InjectionKey<Map<string, SplitPaneState>> = Symbol('SplitPaneContext')
