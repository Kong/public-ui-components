<template>
  <div class="sandbox-container">
    <main>
      <router-view />
    </main>
  </div>
</template>

<style lang="scss" scoped>
body, html {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style lang="scss" scoped>
.sandbox-container {
  padding: 32px;
}
</style>
