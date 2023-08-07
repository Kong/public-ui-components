<template>
  <div class="sandbox-container">
    <EntityFormSection
      description="Descriptive description. This can also be slotted in."
      has-divider
      title="Descriptive Title"
    >
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
      <template #footer>
        <div class="footer">
          <span class="footer-title">Footer slot</span>
          <KIcon icon="kong" />
        </div>
      </template>
    </EntityFormSection>
  </div>
</template>

<script setup lang="ts">
import { EntityFormSection } from '../../src'
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  flex-direction: column;

  .footer-title {
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: $kui-space-40;
    font-size: $kui-font-size-20;
    color: $kui-color-text-neutral;
  }
}
</style>
