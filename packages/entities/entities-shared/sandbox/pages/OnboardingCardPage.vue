<template>
  <div class="sandbox-container">
    <main>
      <OnboardingCard
        v-if="visible"
        :items="items"
        subtitle="Get started with a few quick actions"
        title="Welcome to your service"
        @dismiss="visible = false"
      />
      <KButton
        v-else
        @click="visible = true"
      >
        Show card
      </KButton>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AddIcon, CogIcon, DocumentIcon, ExternalLinkIcon } from '@kong/icons'
import type { OnboardingCardItem } from '../../src/types'
import { OnboardingCard } from '../../src'

const visible = ref(true)

const items: OnboardingCardItem[] = [
  {
    icon: AddIcon,
    title: 'Design',
    description: 'Design your resource from scratch',
    to: { name: 'home' },
  },
  {
    icon: CogIcon,
    appearance: 'decorative-aqua',
    title: 'Configure',
    description: 'Configure routes, plugins, and more',
    onClick: () => console.log('Configure clicked'),
  },
  {
    icon: DocumentIcon,
    appearance: 'decorative-purple',
    title: 'Read the docs',
    description: 'Learn more about this feature',
    href: 'https://developer.konghq.com',
    appendIcon: ExternalLinkIcon,
  },
  {
    title: 'View all',
    variant: 'vertical',
    onClick: () => console.log('View all clicked'),
  },
]
</script>

<style lang="scss" scoped>
.sandbox-container {
  max-width: 1200px;
}
</style>
