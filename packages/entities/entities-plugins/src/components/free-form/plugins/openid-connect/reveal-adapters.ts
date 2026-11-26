import { defineRevealAdapter } from '@kong-ui-public/freeform'
import PrincipalsSection from './PrincipalsSection.vue'

// `PrincipalsSection` renders `config.issuer` in its own template, in both modes, so the form
// can't see it there before it mounts. Naming it lets a reveal open the tab it sits in.
defineRevealAdapter(PrincipalsSection, {
  fields: () => ['config.issuer'],
})
