<template>
  <div class="sandbox-container">
    <main>
      <router-view />
    </main>
  </div>
</template>

<style lang="scss" scoped>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

<style lang="scss" scoped>
.sandbox-container {
  padding: 32px;
}
</style>
