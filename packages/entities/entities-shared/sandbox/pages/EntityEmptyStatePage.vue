<template>
  <div class="sandbox-container">
    <main>
      <h3>Entity empty state</h3>
      <EntityEmptyState
        action-button-text="Create a gateway"
        description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Id quidem aperiam similique vitae beatae. Repellat quam voluptas vitae, maxime consequuntur praesentium suscipit. Numquam aliquid nulla vel esse accusantium reiciendis error?"
        :features="features"
        learn-more
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
        <template #bottom>
          <div class="bottom-content-title-container">
            <h2>
              Get started with the CLI
            </h2>
            <KExternalLink href="https://developer.konghq.com/">
              Read the docs
            </KExternalLink>
          </div>
          <KCodeBlock
            id="bottom-content-code-block"
            code="{example code here}"
            language="plaintext"
            single-line
            theme="dark"
          />
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

<style lang="scss" scoped>
.bottom-content-title-container {
  display: flex;
  justify-content: space-between;

  h2 {
    color: $kui-color-text;
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-50;
    margin: $kui-space-0;
  }
}
</style>
