<template>
  <div class="sandbox-container">
    <main>
      <h3>Entity empty state</h3>
      <EntityEmptyState
        action-button-text="Create a gateway"
        description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?"
        :features="features"
        learn-more
        pricing="Lorem ipsum dolor sit amet consectetur adipisicing elit"
        title="Gateway Manager"
        @click:create="console.log('create button clicked')"
        @click:learn-more="console.log('learning hub button clicked')"
      >
        <template #image>
          <RuntimesIcon />
        </template>
        <template #feature-1-icon>
          <PlugIcon />
        </template>
      </EntityEmptyState>
    </main>
  </div>
</template>

<script setup lang="ts">
import { EntityEmptyState } from '../../src'
import { RuntimesIcon, PlugIcon } from '@kong/icons'

const features = [
  {
    title: 'First',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  },
  {
    title: 'Second',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  }, {
    title: 'Third ',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  },
]
</script>
