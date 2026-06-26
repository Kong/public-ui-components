import type { Ref } from 'vue'

export interface PluginInlineRedisCreateContext {
  /** Konnect managed Redis FF is on */
  enabled: boolean
  isOpen: Ref<boolean>
  partialType: Ref<string>
  /** Set by host app after create; selectors consume and clear */
  selectAfterCreate: Ref<{ id: string, name: string } | undefined>
  open: (partialType?: string) => void
  close: () => void
}
