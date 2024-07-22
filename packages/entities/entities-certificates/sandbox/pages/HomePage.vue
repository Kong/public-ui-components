<template>
  <ul>
    <li>
      <router-link :to="{ name: 'certificate-list' }">
        CertificateList
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'ca-certificate-list' }">
        CACertificateList
      </router-link>
    </li>
  </ul>
</template>
