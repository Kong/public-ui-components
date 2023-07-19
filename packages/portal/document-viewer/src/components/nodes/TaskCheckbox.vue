<template>
  <input
    aria-label="Display-only checkbox for task"
    :checked="checked"
    type="checkbox"
  >
</template>

<script setup lang="ts">
import { ref } from 'vue'

type TaskCheckboxProps = {
  checked: boolean;
};

const props = defineProps<TaskCheckboxProps>()

const checked = ref(props.checked)

</script>
