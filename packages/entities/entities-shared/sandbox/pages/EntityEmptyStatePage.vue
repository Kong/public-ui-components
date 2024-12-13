<template>
  <div class="sandbox-container">
    <main>
      <h3>Entity empty state</h3>
      <EntityEmptyState
        action-button-text="Create a gateway"
        description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?"
        :features="features"
        learn-more-link
        pricing
        title="Gateway Manager"
        @create-button-clicked="console.log('create button clicked')"
        @learning-hub-button-clicked="console.log('learning hub button clicked')"
      >
        <template #icon>
          <RuntimesIcon />
        </template>
        <template #pricing>
          Lorem ipsum dolor sit amet consectetur adipisicing elit
        </template>
      </EntityEmptyState>
    </main>
  </div>
</template>

<script setup lang="ts">
import { EntityEmptyState } from '../../src'
import { RuntimesIcon } from '@kong/icons'

const features = [
  {
    iconVariant: 'deploy',
    title: 'First',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  },
  {
    iconVariant: 'plug',
    title: 'Second',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  }, {
    iconVariant: 'chartData',
    title: 'Third ',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  }, {
    iconVariant: 'analytics',
    title: 'Fourth',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  },
]
</script>
