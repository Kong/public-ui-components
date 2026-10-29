<template>
  <div class="page-layout-sandbox-wrapper">
    <PageLayout
      :anchors="showAnchorNavigation ? anchors : []"
      back-to="/"
      :breadcrumbs="breadcrumbs"
      :page-shortcut-data="showFavoriteButton ? pageShortcutData : undefined"
      :tabs="showTabs ? tabs : []"
    >
      <template #title>
        <h1>Umbrella R&D Dev</h1>
      </template>
      <template #actions>
        <KButton
          appearance="secondary"
          icon
        >
          <MoreIcon />
        </KButton>
      </template>
      <template
        v-if="showTitleAfter"
        #title-after
      >
        <KBadge>Info</KBadge>
      </template>
      <template #tab-gateway-services="{ tab }">
        {{ tab.label }}

        <KBadge size="small">
          2
        </KBadge>
      </template>
      <template #default>
        <AnchorSections
          v-if="showAnchorNavigation"
          ref="anchor-sections"
        />
        <NestedPage v-else />
      </template>
      <template #tab-keys="{ tab }">
        {{ tab.label }}

        <KBadge
          appearance="decorative"
          size="small"
        >
          New
        </KBadge>
      </template>
      <template
        v-if="showAside"
        #aside
      >
        <AboutCard
          description="Drag the handle at the bottom right of the sandbox to narrow the layout."
          :is-loading="aboutCardIsLoading"
          :rows="aboutRows"
          title="About this model"
        >
          <template #row-enabled>
            <KInputSwitch v-model="enabled" />
          </template>
          <template #row-labels>
            <KBadge>env: production</KBadge>
          </template>
        </AboutCard>

        <!-- A second card, to show that every element in the aside sticks, in order -->
        <KCard title="Spend limit">
          <p>$62,400 of $100,000</p>
          <KBadge appearance="info">
            62% consumed
          </KBadge>
          <p>From Engineering (inherited through Platform engineering).</p>
          <KButton appearance="secondary">
            <AddIcon decorative />
            Set spend limit
          </KButton>
        </KCard>
      </template>
    </PageLayout>

    <!-- Teleported from "outside" PageLayout, the way the app shell owns the Ask Kai button.
         `pageLayoutMounted` stands in for that: the target only exists once PageLayout has rendered. -->
    <Teleport
      v-if="pageLayoutMounted && showAskKaiButton"
      to="[data-teleport-target='ask-kai']"
    >
      <KButton appearance="secondary">
        Ask Kai
      </KButton>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, reactive, ref, useTemplateRef } from 'vue'
import { AboutCard, NEW_APPEARANCE_INJECTION_KEY, PageLayout } from '../../src'
import type { AboutCardRow, PageLayoutAnchor, PageLayoutTab, PageShortcutData } from '../../src'
import { AddIcon, MoreIcon } from '@kong/icons'
import NestedPage from './NestedPage.vue'
import AnchorSections from './AnchorSections.vue'
import { buildSandboxAnchors } from '../anchors'
import { useSandboxControls } from '../composables/useSandboxControls'

const { newAppearance, showTabs, showAnchorNavigation, showFavoriteButton, showTitleAfter, showAside, showAskKaiButton, aboutCardIsLoading } = useSandboxControls()

// One section is targeted by its element rather than by a selector, so the anchors are rebuilt
// once the sections have mounted and handed their refs up. PageLayout picks the change up on its
// own -- it watches `anchors`.
const anchorSectionsRef = useTemplateRef<InstanceType<typeof AnchorSections>>('anchor-sections')
const anchors = computed<PageLayoutAnchor[]>(() => buildSandboxAnchors(anchorSectionsRef.value?.sectionElements ?? {}))

const pageLayoutMounted = ref<boolean>(false)

onMounted(() => {
  pageLayoutMounted.value = true
})

const enabled = ref<boolean>(true)

const aboutRows: AboutCardRow[] = [
  { key: 'name', label: 'Name', value: 'gpt-4o-multi-purpose', tooltip: 'The display name of this model.' },
  { key: 'id', label: 'ID', value: 'default-model-1', tooltip: 'The unique identifier of this model.' },
  { key: 'type', label: 'Type', value: 'Model' },
  { key: 'path', label: 'Path', value: '/openai/v1/chat', tooltip: 'The request path this model is served on.' },
  { key: 'host', label: 'Host', value: 'ai.konghq.internal' },
  { key: 'labels', label: 'Labels' },
  { key: 'creator', label: 'Creator', value: 'Dana Whitfield' },
  { key: 'enabled', label: 'Enabled', tooltip: 'Whether this model accepts traffic.' },
  { key: 'created', label: 'Created', value: 'Sep 3, 2026' },
  // Both sides overflow: they wrap and then clamp at two lines.
  {
    key: 'overflow',
    label: 'Upstream load balancing algorithm override policy',
    value: 'consistent-hashing-by-request-header-with-fallback-to-round-robin-across-all-healthy-upstream-targets',
    tooltip: 'A deliberately long label and value, to exercise wrapping and the two-line clamp.',
  },
]

const breadcrumbs = [{
  key: 'api-gateway',
  text: 'API Gateway',
  to: '/',
},
{
  key: 'gateways',
  text: 'Gateways',
  to: '/',
}]

const tabs: PageLayoutTab[] = [
  {
    key: 'overview',
    label: 'Overview',
    to: '/',
    active: true,
  },
  {
    key: 'gateway-services',
    label: 'Gateway services',
    to: { path: '/gateway-services' },
  },
  {
    key: 'routes',
    label: 'Routes',
    to: '/routes',
  },
  {
    key: 'plugins',
    label: 'Plugins',
    to: '/plugins',
  },
  {
    key: 'redis-configurations',
    label: 'Redis configurations',
    to: '/redis-configurations',
  },
  {
    key: 'upstreams',
    label: 'Upstreams',
    to: '/upstreams',
  },
  {
    key: 'certificates',
    label: 'Certificates',
    to: '/certificates',
  },
  {
    key: 'snis',
    label: 'SNIs',
    to: '/snis',
  },
  {
    key: 'vaults',
    label: 'Vaults',
    to: '/vaults',
  },
  {
    key: 'keys',
    label: 'Keys',
    to: '/keys',
  },
]

const pageShortcutsContext = reactive({
  isFavorite: false,
  onFavoriteToggle: () => {
    pageShortcutsContext.isFavorite = !pageShortcutsContext.isFavorite
  },
  onEntityPageVisit: () => {
    console.log('onEntityPageVisit')
  },
})

provide('app:pageShortcutsContext', pageShortcutsContext)

// The host app owns the appearance: PageLayout reads it through inject. Providing the
// ref itself keeps it reactive to the sandbox toggle.
provide(NEW_APPEARANCE_INJECTION_KEY, newAppearance)

const pageShortcutData: PageShortcutData = {
  label: 'Home',
  path: '/',
  entityType: 'sandbox',
}
</script>

<style lang="scss" scoped>
.page-layout-sandbox-wrapper {
  // `overflow-x: auto` computes `overflow-y` to `auto` too, which makes this element the
  // nearest scroll container for the sticky header inside it. Bounding the height gives it
  // something to actually scroll, so the sticky behaviour is demonstrable here.
  max-height: 80vh;
  overflow: auto;
  resize: horizontal;
  width: 90%;
}
</style>
