// ../../../vite.config.shared.ts
import { defineConfig } from "file:///Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components/node_modules/.pnpm/vite@4.3.9_@types+node@18.16.16_sass@1.63.2/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components/node_modules/.pnpm/@vitejs+plugin-vue@4.2.3_vite@4.3.9_vue@3.2.47/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.0.1_vite@4.3.9_vue@3.2.47/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import dns from "dns";
import path, { join } from "path";
import { visualizer } from "file:///Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components/node_modules/.pnpm/rollup-plugin-visualizer@5.9.0/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components";
dns.setDefaultResultOrder("verbatim");
var buildVisualizerPlugin = process.env.BUILD_VISUALIZER ? visualizer({
  filename: path.resolve(__vite_injected_original_dirname, `packages/${process.env.BUILD_VISUALIZER}/bundle-analyzer/stats-treemap.html`),
  template: "treemap",
  // sunburst|treemap|network
  sourcemap: true,
  gzipSize: true
}) : void 0;
var sanitizePackageName = (packageName2) => {
  const sanitizedName = (packageName2 || "").replace(/Analytics/g, "Vitals").replace(/analytics/gi, "vitals");
  return sanitizedName;
};
var vite_config_shared_default = defineConfig({
  plugins: [
    vue(),
    vueJsx()
  ],
  resolve: {
    // Use this option to force Vite to always resolve listed dependencies to the same copy (from project root)
    dedupe: ["vue", "vue-router", "@kong/kongponents"]
  },
  build: {
    outDir: "./dist",
    cssCodeSplit: false,
    minify: true,
    sourcemap: !!process.env.BUILD_VISUALIZER,
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled into your library
      // If config.build.rollupOptions.external is also set at the package level, the arrays will be merged
      external: ["vue", "vue-router", "@kong/kongponents", "axios"],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "@kong/kongponents": "Kongponents",
          axios: "axios"
        },
        exports: "named"
      },
      plugins: [
        // visualizer must remain last in the list of plugins
        buildVisualizerPlugin
      ]
    }
  },
  optimizeDeps: {
    include: [
      "vue",
      "vue-router"
    ]
  },
  server: {
    fs: {
      /**
       * Allow serving files from one level up from the package root - IMPORTANT - since this is a monorepo
       */
      allow: [join(__vite_injected_original_dirname, "..")]
    }
  },
  // Change the root when utilizing the sandbox via USE_SANDBOX=true to use the `/sandbox/*` files
  // During the build process, the `/sandbox/*` files are not used and we should default to the package root.
  root: process.env.USE_SANDBOX ? "./sandbox" : process.cwd(),
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    coverage: {
      reporter: ["text", "json", "html"]
    },
    deps: {
      registerNodeLoader: true
      // Ensure modules are imported properly
    },
    include: ["**/src/**/*.spec.ts"],
    exclude: [
      "**/dist/**",
      "**/__template__/**",
      "**/node_modules/**",
      "packages/core/cli/**"
    ]
  }
});

// vite.config.ts
import { resolve } from "path";
import { defineConfig as defineConfig2, mergeConfig } from "file:///Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components/node_modules/.pnpm/vite@4.3.9_@types+node@18.16.16_sass@1.63.2/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname2 = "/Users/val.gorodnichev@konghq.com/Code/Kong/ui/public-ui-components/packages/core/copy-uuid";
var packageName = "copy-uuid";
var sanitizedPackageName = sanitizePackageName(packageName);
var config = mergeConfig(vite_config_shared_default, defineConfig2({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__vite_injected_original_dirname2, "./src/index.ts"),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled into your library
      external: ["@kong-ui-public/i18n"],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          "@kong-ui-public/i18n": "kong-ui-public-i18n"
        }
      }
    }
  }
}));
if (process.env.PREVIEW_SANDBOX) {
  config.build.rollupOptions.external = void 0;
  config.build.lib = void 0;
}
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vdml0ZS5jb25maWcuc2hhcmVkLnRzIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3ZhbC5nb3JvZG5pY2hldkBrb25naHEuY29tL0NvZGUvS29uZy91aS9wdWJsaWMtdWktY29tcG9uZW50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3ZhbC5nb3JvZG5pY2hldkBrb25naHEuY29tL0NvZGUvS29uZy91aS9wdWJsaWMtdWktY29tcG9uZW50cy92aXRlLmNvbmZpZy5zaGFyZWQudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3ZhbC5nb3JvZG5pY2hldkBrb25naHEuY29tL0NvZGUvS29uZy91aS9wdWJsaWMtdWktY29tcG9uZW50cy92aXRlLmNvbmZpZy5zaGFyZWQudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbi8qKlxuICogU2hhcmVkIFZpdGUgY29uZmlnIHNldHRpbmdzIGZvciBhbGwgY29tcG9uZW50c1xuICovXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgZG5zIGZyb20gJ2RucydcbmltcG9ydCBwYXRoLCB7IGpvaW4gfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcblxuLy8gWW91IGNhbiBzZXQgZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcigndmVyYmF0aW0nKSB0byBkaXNhYmxlIHRoZSByZW9yZGVyaW5nIGJlaGF2aW9yLiBWaXRlIHdpbGwgdGhlbiBwcmludCB0aGUgYWRkcmVzcyBhcyBsb2NhbGhvc3Rcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvc2VydmVyLW9wdGlvbnMuaHRtbCNzZXJ2ZXItaG9zdFxuZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcigndmVyYmF0aW0nKVxuXG4vLyBJbmNsdWRlIHRoZSByb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXIgaWYgdGhlIEJVSUxEX1ZJU1VBTElaRVIgZW52IHZhciBpcyBzZXQgdG8gXCJ0cnVlXCJcbmNvbnN0IGJ1aWxkVmlzdWFsaXplclBsdWdpbiA9IHByb2Nlc3MuZW52LkJVSUxEX1ZJU1VBTElaRVJcbiAgPyB2aXN1YWxpemVyKHtcbiAgICBmaWxlbmFtZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYHBhY2thZ2VzLyR7cHJvY2Vzcy5lbnYuQlVJTERfVklTVUFMSVpFUn0vYnVuZGxlLWFuYWx5emVyL3N0YXRzLXRyZWVtYXAuaHRtbGApLFxuICAgIHRlbXBsYXRlOiAndHJlZW1hcCcsIC8vIHN1bmJ1cnN0fHRyZWVtYXB8bmV0d29ya1xuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBnemlwU2l6ZTogdHJ1ZSxcbiAgfSlcbiAgOiB1bmRlZmluZWRcblxuLyoqXG4gKiBTYW5pdGl6ZSBwYWNrYWdlL2ZpbGVuYW1lIHRvIGV4Y2x1ZGUgdW5kZXNpcmVkIHN0cmluZ3NcbiAqIElNUE9SQU5UOiBJZiB0aGlzIGZ1bmN0aW9uIGlzIGNoYW5nZWQsIHlvdSAqKm11c3QqKiBjaGFuZ2UgdGhlIGZ1bmN0aW9uIGluIGAvcGFja2FnZXMvY29yZS9jbGkvc3JjL2NvcmUvcGFja2FnZS50c2AgYXMgd2VsbC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZSBUaGUgc3RyaW5nIHRvIHNhbml0aXplXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgc2FuaXRpemVkIHBhY2thZ2UvZmlsZW5hbWUgc3RyaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBzYW5pdGl6ZVBhY2thZ2VOYW1lID0gKHBhY2thZ2VOYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAvLyBBZGQgYWRkaXRpb25hbCByZXBsYWNlIHJ1bGVzIGFzIG5lZWRlZFxuXG4gIC8vIFJlcGxhY2UgYW55IHZhcmlhdGlvbiBvZiBzdHJpbmcgJ0FuYWx5dGljcycgaW4gYXNzZXRzIGFuZCBjaHVua3MuIFRoZXNlIGFyZSBpbiBvcmRlciB0byBwcmVzZXJ2ZSBjYXBpdGFsaXphdGlvbi5cbiAgLy8gKFNvbWUgYWRibG9jayBmaWx0ZXIgbGlzdHMgZGVueSByZXF1ZXN0cyBmb3IgZmlsZXMgc3RhcnRpbmcgd2l0aCBcImFzc2V0cy9hbmFseXRpY3NcIi4gIFNlZSBNQS05MjYgZm9yIG1vcmUgY29udGV4dC4pXG4gIGNvbnN0IHNhbml0aXplZE5hbWUgPSAocGFja2FnZU5hbWUgfHwgJycpLnJlcGxhY2UoL0FuYWx5dGljcy9nLCAnVml0YWxzJykucmVwbGFjZSgvYW5hbHl0aWNzL2dpLCAndml0YWxzJylcblxuICByZXR1cm4gc2FuaXRpemVkTmFtZVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgdnVlSnN4KCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICAvLyBVc2UgdGhpcyBvcHRpb24gdG8gZm9yY2UgVml0ZSB0byBhbHdheXMgcmVzb2x2ZSBsaXN0ZWQgZGVwZW5kZW5jaWVzIHRvIHRoZSBzYW1lIGNvcHkgKGZyb20gcHJvamVjdCByb290KVxuICAgIGRlZHVwZTogWyd2dWUnLCAndnVlLXJvdXRlcicsICdAa29uZy9rb25ncG9uZW50cyddLFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4vZGlzdCcsXG4gICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgICBtaW5pZnk6IHRydWUsXG4gICAgc291cmNlbWFwOiAhIXByb2Nlc3MuZW52LkJVSUxEX1ZJU1VBTElaRVIsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLy8gTWFrZSBzdXJlIHRvIGV4dGVybmFsaXplIGRlcHMgdGhhdCBzaG91bGRuJ3QgYmUgYnVuZGxlZCBpbnRvIHlvdXIgbGlicmFyeVxuICAgICAgLy8gSWYgY29uZmlnLmJ1aWxkLnJvbGx1cE9wdGlvbnMuZXh0ZXJuYWwgaXMgYWxzbyBzZXQgYXQgdGhlIHBhY2thZ2UgbGV2ZWwsIHRoZSBhcnJheXMgd2lsbCBiZSBtZXJnZWRcbiAgICAgIGV4dGVybmFsOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ0Brb25nL2tvbmdwb25lbnRzJywgJ2F4aW9zJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gUHJvdmlkZSBnbG9iYWwgdmFyaWFibGVzIHRvIHVzZSBpbiB0aGUgVU1EIGJ1aWxkIGZvciBleHRlcm5hbGl6ZWQgZGVwc1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgdnVlOiAnVnVlJyxcbiAgICAgICAgICAndnVlLXJvdXRlcic6ICdWdWVSb3V0ZXInLFxuICAgICAgICAgICdAa29uZy9rb25ncG9uZW50cyc6ICdLb25ncG9uZW50cycsXG4gICAgICAgICAgYXhpb3M6ICdheGlvcycsXG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydHM6ICduYW1lZCcsXG4gICAgICB9LFxuICAgICAgcGx1Z2luczogW1xuICAgICAgICAvLyB2aXN1YWxpemVyIG11c3QgcmVtYWluIGxhc3QgaW4gdGhlIGxpc3Qgb2YgcGx1Z2luc1xuICAgICAgICBidWlsZFZpc3VhbGl6ZXJQbHVnaW4sXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICd2dWUnLFxuICAgICAgJ3Z1ZS1yb3V0ZXInLFxuICAgIF0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGZzOiB7XG4gICAgICAvKipcbiAgICAgICAqIEFsbG93IHNlcnZpbmcgZmlsZXMgZnJvbSBvbmUgbGV2ZWwgdXAgZnJvbSB0aGUgcGFja2FnZSByb290IC0gSU1QT1JUQU5UIC0gc2luY2UgdGhpcyBpcyBhIG1vbm9yZXBvXG4gICAgICAgKi9cbiAgICAgIGFsbG93OiBbam9pbihfX2Rpcm5hbWUsICcuLicpXSxcbiAgICB9LFxuICB9LFxuICAvLyBDaGFuZ2UgdGhlIHJvb3Qgd2hlbiB1dGlsaXppbmcgdGhlIHNhbmRib3ggdmlhIFVTRV9TQU5EQk9YPXRydWUgdG8gdXNlIHRoZSBgL3NhbmRib3gvKmAgZmlsZXNcbiAgLy8gRHVyaW5nIHRoZSBidWlsZCBwcm9jZXNzLCB0aGUgYC9zYW5kYm94LypgIGZpbGVzIGFyZSBub3QgdXNlZCBhbmQgd2Ugc2hvdWxkIGRlZmF1bHQgdG8gdGhlIHBhY2thZ2Ugcm9vdC5cbiAgcm9vdDogcHJvY2Vzcy5lbnYuVVNFX1NBTkRCT1ggPyAnLi9zYW5kYm94JyA6IHByb2Nlc3MuY3dkKCksXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6IFtdLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLFxuICAgIH0sXG4gICAgZGVwczoge1xuICAgICAgcmVnaXN0ZXJOb2RlTG9hZGVyOiB0cnVlLCAvLyBFbnN1cmUgbW9kdWxlcyBhcmUgaW1wb3J0ZWQgcHJvcGVybHlcbiAgICB9LFxuICAgIGluY2x1ZGU6IFsnKiovc3JjLyoqLyouc3BlYy50cyddLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgICcqKi9kaXN0LyoqJyxcbiAgICAgICcqKi9fX3RlbXBsYXRlX18vKionLFxuICAgICAgJyoqL25vZGVfbW9kdWxlcy8qKicsXG4gICAgICAncGFja2FnZXMvY29yZS9jbGkvKionLFxuICAgIF0sXG4gIH0sXG59KVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdmFsLmdvcm9kbmljaGV2QGtvbmdocS5jb20vQ29kZS9Lb25nL3VpL3B1YmxpYy11aS1jb21wb25lbnRzL3BhY2thZ2VzL2NvcmUvY29weS11dWlkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdmFsLmdvcm9kbmljaGV2QGtvbmdocS5jb20vQ29kZS9Lb25nL3VpL3B1YmxpYy11aS1jb21wb25lbnRzL3BhY2thZ2VzL2NvcmUvY29weS11dWlkL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy92YWwuZ29yb2RuaWNoZXZAa29uZ2hxLmNvbS9Db2RlL0tvbmcvdWkvcHVibGljLXVpLWNvbXBvbmVudHMvcGFja2FnZXMvY29yZS9jb3B5LXV1aWQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgc2hhcmVkVml0ZUNvbmZpZywgeyBzYW5pdGl6ZVBhY2thZ2VOYW1lIH0gZnJvbSAnLi4vLi4vLi4vdml0ZS5jb25maWcuc2hhcmVkJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIG1lcmdlQ29uZmlnIH0gZnJvbSAndml0ZSdcblxuLy8gUGFja2FnZSBuYW1lIE1VU1QgYWx3YXlzIG1hdGNoIHRoZSBrZWJhYi1jYXNlIHBhY2thZ2UgbmFtZSBpbnNpZGUgdGhlIGNvbXBvbmVudCdzIHBhY2thZ2UuanNvbiBmaWxlIGFuZCB0aGUgbmFtZSBvZiB5b3VyIGAvcGFja2FnZXMve3BhY2thZ2UtbmFtZX1gIGRpcmVjdG9yeVxuY29uc3QgcGFja2FnZU5hbWUgPSAnY29weS11dWlkJ1xuY29uc3Qgc2FuaXRpemVkUGFja2FnZU5hbWUgPSBzYW5pdGl6ZVBhY2thZ2VOYW1lKHBhY2thZ2VOYW1lKVxuXG4vLyBNZXJnZSB0aGUgc2hhcmVkIFZpdGUgY29uZmlnIHdpdGggdGhlIGxvY2FsIG9uZSBkZWZpbmVkIGJlbG93XG5jb25zdCBjb25maWcgPSBtZXJnZUNvbmZpZyhzaGFyZWRWaXRlQ29uZmlnLCBkZWZpbmVDb25maWcoe1xuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgLy8gVGhlIGtlYmFiLWNhc2UgbmFtZSBvZiB0aGUgZXhwb3NlZCBnbG9iYWwgdmFyaWFibGUuIE1VU1QgYmUgaW4gdGhlIGZvcm1hdCBga29uZy11aS1wdWJsaWMte3BhY2thZ2UtbmFtZX1gXG4gICAgICAvLyBFeGFtcGxlOiBuYW1lOiAna29uZy11aS1wdWJsaWMtZGVtby1jb21wb25lbnQnXG4gICAgICBuYW1lOiBga29uZy11aS1wdWJsaWMtJHtzYW5pdGl6ZWRQYWNrYWdlTmFtZX1gLFxuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvaW5kZXgudHMnKSxcbiAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiBgJHtzYW5pdGl6ZWRQYWNrYWdlTmFtZX0uJHtmb3JtYXR9LmpzYCxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIC8vIE1ha2Ugc3VyZSB0byBleHRlcm5hbGl6ZSBkZXBzIHRoYXQgc2hvdWxkbid0IGJlIGJ1bmRsZWQgaW50byB5b3VyIGxpYnJhcnlcbiAgICAgIGV4dGVybmFsOiBbJ0Brb25nLXVpLXB1YmxpYy9pMThuJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gUHJvdmlkZSBnbG9iYWwgdmFyaWFibGVzIHRvIHVzZSBpbiB0aGUgVU1EIGJ1aWxkIGZvciBleHRlcm5hbGl6ZWQgZGVwc1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgJ0Brb25nLXVpLXB1YmxpYy9pMThuJzogJ2tvbmctdWktcHVibGljLWkxOG4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSkpXG5cbi8vIElmIHdlIGFyZSB0cnlpbmcgdG8gcHJldmlldyBhIGJ1aWxkIG9mIHRoZSBsb2NhbCBgcGFja2FnZS9jb3B5LXV1aWQvc2FuZGJveGAgZGlyZWN0b3J5LFxuLy8gdW5zZXQgdGhlIGV4dGVybmFsIGFuZCBsaWIgcHJvcGVydGllc1xuaWYgKHByb2Nlc3MuZW52LlBSRVZJRVdfU0FOREJPWCkge1xuICBjb25maWcuYnVpbGQucm9sbHVwT3B0aW9ucy5leHRlcm5hbCA9IHVuZGVmaW5lZFxuICBjb25maWcuYnVpbGQubGliID0gdW5kZWZpbmVkXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZ1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUtBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sUUFBUSxZQUFZO0FBQzNCLFNBQVMsa0JBQWtCO0FBVjNCLElBQU0sbUNBQW1DO0FBY3pDLElBQUksc0JBQXNCLFVBQVU7QUFHcEMsSUFBTSx3QkFBd0IsUUFBUSxJQUFJLG1CQUN0QyxXQUFXO0FBQUEsRUFDWCxVQUFVLEtBQUssUUFBUSxrQ0FBVyxZQUFZLFFBQVEsSUFBSSxxREFBcUQ7QUFBQSxFQUMvRyxVQUFVO0FBQUE7QUFBQSxFQUNWLFdBQVc7QUFBQSxFQUNYLFVBQVU7QUFDWixDQUFDLElBQ0M7QUFRRyxJQUFNLHNCQUFzQixDQUFDQSxpQkFBZ0M7QUFLbEUsUUFBTSxpQkFBaUJBLGdCQUFlLElBQUksUUFBUSxjQUFjLFFBQVEsRUFBRSxRQUFRLGVBQWUsUUFBUTtBQUV6RyxTQUFPO0FBQ1Q7QUFFQSxJQUFPLDZCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsU0FBUztBQUFBO0FBQUEsSUFFUCxRQUFRLENBQUMsT0FBTyxjQUFjLG1CQUFtQjtBQUFBLEVBQ25EO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsSUFDZCxRQUFRO0FBQUEsSUFDUixXQUFXLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFBQSxJQUN6QixlQUFlO0FBQUE7QUFBQTtBQUFBLE1BR2IsVUFBVSxDQUFDLE9BQU8sY0FBYyxxQkFBcUIsT0FBTztBQUFBLE1BQzVELFFBQVE7QUFBQTtBQUFBLFFBRU4sU0FBUztBQUFBLFVBQ1AsS0FBSztBQUFBLFVBQ0wsY0FBYztBQUFBLFVBQ2QscUJBQXFCO0FBQUEsVUFDckIsT0FBTztBQUFBLFFBQ1Q7QUFBQSxRQUNBLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxTQUFTO0FBQUE7QUFBQSxRQUVQO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BSUYsT0FBTyxDQUFDLEtBQUssa0NBQVcsSUFBSSxDQUFDO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBLEVBR0EsTUFBTSxRQUFRLElBQUksY0FBYyxjQUFjLFFBQVEsSUFBSTtBQUFBLEVBQzFELE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQztBQUFBLElBQ2IsVUFBVTtBQUFBLE1BQ1IsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsSUFDbkM7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNKLG9CQUFvQjtBQUFBO0FBQUEsSUFDdEI7QUFBQSxJQUNBLFNBQVMsQ0FBQyxxQkFBcUI7QUFBQSxJQUMvQixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzs7O0FDOUdELFNBQVMsZUFBZTtBQUN4QixTQUFTLGdCQUFBQyxlQUFjLG1CQUFtQjtBQUYxQyxJQUFNQyxvQ0FBbUM7QUFLekMsSUFBTSxjQUFjO0FBQ3BCLElBQU0sdUJBQXVCLG9CQUFvQixXQUFXO0FBRzVELElBQU0sU0FBUyxZQUFZLDRCQUFrQkMsY0FBYTtBQUFBLEVBQ3hELE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQTtBQUFBO0FBQUEsTUFHSCxNQUFNLGtCQUFrQjtBQUFBLE1BQ3hCLE9BQU8sUUFBUUMsbUNBQVcsZ0JBQWdCO0FBQUEsTUFDMUMsVUFBVSxDQUFDLFdBQVcsR0FBRyx3QkFBd0I7QUFBQSxJQUNuRDtBQUFBLElBQ0EsZUFBZTtBQUFBO0FBQUEsTUFFYixVQUFVLENBQUMsc0JBQXNCO0FBQUEsTUFDakMsUUFBUTtBQUFBO0FBQUEsUUFFTixTQUFTO0FBQUEsVUFDUCx3QkFBd0I7QUFBQSxRQUMxQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUMsQ0FBQztBQUlGLElBQUksUUFBUSxJQUFJLGlCQUFpQjtBQUMvQixTQUFPLE1BQU0sY0FBYyxXQUFXO0FBQ3RDLFNBQU8sTUFBTSxNQUFNO0FBQ3JCO0FBRUEsSUFBTyxzQkFBUTsiLAogICJuYW1lcyI6IFsicGFja2FnZU5hbWUiLCAiZGVmaW5lQ29uZmlnIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgImRlZmluZUNvbmZpZyIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSJdCn0K
