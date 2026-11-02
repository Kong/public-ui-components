import UpstreamsConfigCardView from './components/UpstreamsConfigCardView.vue'
import UpstreamsList from './components/UpstreamsList.vue'
import TargetsList from './components/TargetsList.vue'
import TargetForm from './components/TargetForm.vue'
import UpstreamsForm from './components/UpstreamsForm.vue'
import UpstreamsConfigCard from './components/UpstreamsConfigCard.vue'

export { UpstreamsList }
export { TargetsList }
export { TargetForm }
export { UpstreamsForm }
export { UpstreamsConfigCard }

export * from './types'

export { UpstreamsConfigCardView }
export type UpstreamsConfigCardViewProps = InstanceType<typeof UpstreamsConfigCardView>['$props']
