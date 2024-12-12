<template>
  <div class="sandbox-container">
    <main>
      <h3>Entity empty state</h3>
      <EntityEmptyState
        action-button-text="Create a gateway"
        description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?"
        :features="features"
        learn-more-link="https://konghq.com"
        pricing="Lorem ipsum dolor sit amet consectetur adipisicing elit."
        title="Gateway Manager"
      >
        <template #icon>
          <RuntimesIcon />
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
    icon: RuntimesIcon,
    title: 'First',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  },
  {
    icon: RuntimesIcon,
    title: 'Second',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  }, {
    icon: RuntimesIcon,
    title: 'Third ',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  }, {
    icon: RuntimesIcon,
    title: 'Fourth',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae',
  },
]
</script>
