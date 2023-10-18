<template>
  <div class="page-content">
    <nav class="sidebar">
      <ul>
        <li>
          <router-link to="/">
            Analytics Charts
          </router-link>
        </li>
        <li>
          <router-link to="/simple">
            Simple Charts
          </router-link>
        </li>
      </ul>
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss">
.page-content {
  display: flex;
  flex-direction: row;
}
nav.sidebar {
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 8px 0;
  line-height: 1.5;
}
</style>
