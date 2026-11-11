import EntityConfigCardView from './components/entity-base-config-card/EntityConfigCardView.vue'
import OnboardingCard from './components/onboarding-card/OnboardingCard.vue'
import EntityBaseConfigCard from './components/entity-base-config-card/EntityBaseConfigCard.vue'
import ConfigCardItem from './components/entity-base-config-card/ConfigCardItem.vue'
import ConfigCardDisplay from './components/entity-base-config-card/ConfigCardDisplay.vue'
import InternalLinkItem from './components/entity-base-config-card/InternalLinkItem.vue'
import EntityBaseForm from './components/entity-base-form/EntityBaseForm.vue'
import EntityBaseTable from './components/entity-base-table/EntityBaseTable.vue'
import EntityDeleteModal from './components/entity-delete-modal/EntityDeleteModal.vue'
import EntityFilter from './components/entity-filter/EntityFilter.vue'
import EntityToggleModal from './components/entity-toggle-modal/EntityToggleModal.vue'
import PermissionsWrapper from './components/permissions-wrapper/PermissionsWrapper.vue'
import EntityFormSection from './components/entity-form-section/EntityFormSection.vue'
import EntityFormBlock from './components/entity-form-block/EntityFormBlock.vue'
import EntityLink from './components/entity-link/EntityLink.vue'
import EntityEmptyState from './components/entity-empty-state/EntityEmptyState.vue'
import JsonCodeBlock from './components/common/JsonCodeBlock.vue'
import TerraformCodeBlock from './components/common/TerraformCodeBlock.vue'
import YamlCodeBlock from './components/common/YamlCodeBlock.vue'
import DeckCodeBlock from './components/common/DeckCodeBlock.vue'
import GeneratePatModal from './components/common/GeneratePatModal.vue'
import SensitiveInput from './components/common/SensitiveInput.vue'
import TableTags from './components/common/TableTags.vue'
import composables from './composables'

// Extract specific composables to export
const { useAxios, useDeleteUrlBuilder, useBaseEntityDeckOptions, useBaseFormDeckOptions, useErrors, useExternalLinkCreator, useFetchUrlBuilder, useFetcher, useFetcherCacheKey, useDebouncedFilter, useStringHelpers, useHelpers, useGatewayFeatureSupported, useTruncationDetector, useValidators, useSchema, useSchemaProvider, useTableState, useManagedByEnabled, useManagedByColumn } = composables

// Components
export { EntityConfigCardView, OnboardingCard, EntityBaseConfigCard, ConfigCardItem, ConfigCardDisplay, InternalLinkItem, EntityBaseForm, EntityBaseTable, EntityDeleteModal, EntityFilter, EntityToggleModal, PermissionsWrapper, EntityFormSection, EntityFormBlock, EntityLink, EntityEmptyState, JsonCodeBlock, TerraformCodeBlock, YamlCodeBlock, DeckCodeBlock, GeneratePatModal, SensitiveInput, TableTags }

// Composables
export { useAxios, useDeleteUrlBuilder, useBaseEntityDeckOptions, useBaseFormDeckOptions, useErrors, useExternalLinkCreator, useFetchUrlBuilder, useFetcher, useFetcherCacheKey, useDebouncedFilter, useStringHelpers, useHelpers, useGatewayFeatureSupported, useTruncationDetector, useValidators, useSchema, useSchemaProvider, useTableState, useManagedByEnabled, useManagedByColumn }

// Types
export * from './types'

// Constants
export * from './constants'

export { highlightCodeBlock } from './utils/code-block'
// `MANAGED_BY_LABELS` is exported alongside the resolver because consumers that render
// owner names outside a table or config card (Gateway Manager's takeover notice) need the
// map itself: `getManagedByLabel` collapses an unrecognised owner to "Custom", which reads
// wrong in prose ("This entity is managed by Custom"). Exporting it keeps those surfaces on
// the same source of truth instead of maintaining a second copy that drifts.
export { getManagedByLabel, getManagedByFieldLabel, MANAGED_BY_LABELS } from './utils/managed-by'
export type { ManagedBy } from './utils/managed-by'
