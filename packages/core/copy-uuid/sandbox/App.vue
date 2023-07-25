<template>
  <div class="sandbox-container">
    <main>
      <div>
        <h3>Default</h3>
        <CopyUuid :uuid="uuid" />
      </div>
      <div>
        <h3>truncated=false</h3>
        <CopyUuid
          :truncated="false"
          :uuid="uuid"
        />
      </div>
      <div>
        <h3>use-mono=false</h3>
        <CopyUuid
          :use-mono="false"
          :uuid="uuid"
        />
      </div>
      <div>
        <h3>is-hidden=true</h3>
        <CopyUuid
          is-hidden
          :uuid="uuid"
        />
      </div>
      <div>
        <h3>icon-color=#473cfb</h3>
        <CopyUuid
          icon-color="#473cfb"
          :uuid="uuid"
        />
      </div>
      <div>
        <h3>tooltip</h3>
        <CopyUuid
          tooltip="Click to copy"
          :uuid="uuid"
        />
      </div>
      <div>
        <h3>tooltip + success tooltip</h3>
        <CopyUuid
          :notify="() => {}"
          success-tooltip="Copied!"
          tooltip="Click to copy"
          :uuid="uuid"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const uuid = '1234567890ABCDEFG'
</script>
