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
        <h3>icon-color=var(--purple-400, #473cfb)</h3>
        <CopyUuid
          icon-color="var(--purple-400, #473cfb)"
          :uuid="uuid"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const uuid = '1234567890ABCDEFG'
</script>
