<script lang="ts" setup>
import { useFavicon, useTitle } from "@vueuse/core"
import { onMounted } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const FIXED_USER_ID = "573876541822599199"

// Hooks
useTitle("Lanyard Visualizer")
useFavicon("/logo.png")

onMounted(() => {
  router.replace(`/${FIXED_USER_ID}`)
})
</script>

<template>
  <div class="h-screen grid place-items-center text-white/50">
    Redirecting to your status...
  </div>
</template>
