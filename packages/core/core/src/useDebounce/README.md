# useDebounce

Provides a `debounce` function, that, as long as it continues to be invoked, will not be triggered. The initial function will be called after the debounced function stops being called for a certain number of milliseconds.

## Example

```html
<script setup lang="ts">
import { useDebounce } from '@kong-ui-public/core'


const windowWidth = ref<number>()
const { debounce } = useDebounce()
const debouncedResizeHandler = debounce(() => {
  // Only trigger toggle if the sidebar is open, and if the windowWidth changes
  if (mobileSidebarOpen.value && (windowWidth.value !== window?.innerWidth || 0)) {
    windowWidth.value = window?.innerWidth
    toggleSidebar(false)
  }
}, 200)

onMounted(() => {
  // Set the window width once the component mounts
  windowWidth.value = window?.innerWidth
  // Automatically close the sidebar if the window is resized
  window.addEventListener('resize', debouncedResizeHandler)
})

onBeforeUnmount(() => {
  // Cleanup event listener(s)
  window.removeEventListener('resize', debouncedResizeHandler)
})
</script>
```
