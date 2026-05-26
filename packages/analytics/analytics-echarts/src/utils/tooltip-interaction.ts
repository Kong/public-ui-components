import type { TooltipInteractionMode } from '../types'

export const isTooltipInteractive = (interactionMode: TooltipInteractionMode) => {
  return ['interactive', 'zoom-interactive'].includes(interactionMode)
}
