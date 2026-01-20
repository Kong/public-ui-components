<template>
  <div class="sandbox-container">
    <EntityFormBlock
      description="Descriptive description. This can also be slotted in."
      :step="1"
      title="Descriptive Title. This can also be slotted in."
    >
      <template #title>
        Slotted Title. This can also be passed as a prop.
      </template>
      <template #description>
        <p>
          Slotted descriptive description. This can also be passed as a prop.
        </p>
      </template>
      <KInput
        label="Input 1"
        placeholder="Foo"
      />
      <KInput
        label="Input 2"
        placeholder="Bar"
      />
      <template #extra>
        <div class="footer">
          <span class="footer-title">Extra slot</span>
          <KongIcon />
        </div>
      </template>
    </EntityFormBlock>

    <EntityFormBlock
      description="Descriptive description. This can also be slotted in."
      title="Descriptive Title. This can also be slotted in."
    >
      <KInput
        label="Input 1"
        placeholder="Foo"
      />
      <KInput
        label="Input 2"
        placeholder="Bar"
      />
    </EntityFormBlock>
  </div>
</template>

<script setup lang="ts">
import { EntityFormBlock } from '../../src'
import { KongIcon } from '@kong/icons'
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}

p {
  margin: 0;
}

.footer {
  display: flex;
  flex-direction: column;

  .footer-title {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: 600;
    margin-bottom: $kui-space-40;
    text-transform: uppercase;
  }
}
</style>
