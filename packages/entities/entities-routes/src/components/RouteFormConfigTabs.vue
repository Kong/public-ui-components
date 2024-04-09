<template>
  <KTabs
    v-if="tabs.length > 1"
    v-model="tab"
    :tabs="tabs"
    @change="(t: string) => tab = t"
  >
    <template
      v-if="routeFlavors.traditional"
      #[RouteFlavor.TRADITIONAL]
    >
      <slot name="before-content" />

      <slot :name="RouteFlavor.TRADITIONAL" />
    </template>

    <template
      v-if="routeFlavors.expressions"
      #[RouteFlavor.EXPRESSIONS]
    >
      <slot name="before-content" />

      <slot :name="RouteFlavor.EXPRESSIONS" />
    </template>
  </KTabs>

  <template v-else>
    <slot name="before-content" />

    <slot
      v-if="routeFlavors.traditional"
      :name="RouteFlavor.TRADITIONAL"
    />

    <slot
      v-else-if="routeFlavors.expressions"
      :name="RouteFlavor.EXPRESSIONS"
    />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RouteFlavors, RouteFlavor } from '../types'

const tab = defineModel<string>()

const props = defineProps<{
  routeFlavors: RouteFlavors
}>()

const tabs = computed(() => [
  ...props.routeFlavors.traditional
    ? [{
      hash: RouteFlavor.TRADITIONAL,
      title: 'Traditional',
    }]
    : [],
  ...props.routeFlavors.expressions
    ? [{
      hash: RouteFlavor.EXPRESSIONS,
      title: 'Expressions',
    }]
    : [],
])
</script>
