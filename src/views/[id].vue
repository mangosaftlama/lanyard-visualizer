<script lang="ts" setup>
import { useWebSocket, useTitle, useFavicon } from "@vueuse/core"
import { computed, ref, reactive, watchEffect, onBeforeUnmount } from "vue"
import { onBeforeRouteLeave } from "vue-router"

// Components
import Card from "../components/Card.vue"

// Types
import type { LanyardData } from "../types/lanyard"

const socketLoaded = ref(false)
const imageError = ref(false)
const heartbeatInterval = ref<number | null>(null)

const user = reactive({ error: false, data: {} }) as {
  error: boolean
  data: LanyardData
}

// Computed methods

/**
 * Returns if we still haven't connected to Lanyard API.
 */
const isConnecting = computed(
  () => socketLoaded.value === false && Object.keys(user.data)?.length === 0,
)

/**
 * Returns user information including formatted avatar URL.
 */
const getUser = computed(() => {
  const { username, id, avatar } = user.data?.discord_user || {}
  const fallbackImage = "https://i.imgur.com/sn7gwcA.png"
  const normalizedUsername = username?.replace(/#0$/, "")

  const avatarUri = `https://cdn.discordapp.com/avatars/${id}/${avatar}.${
    avatar?.startsWith("a_") ? "gif" : "png"
  }?size=512`

  return {
    id,
    username: normalizedUsername || "Loading",
    avatar: avatar && imageError.value === false ? avatarUri : fallbackImage,
  }
})

/**
 * Returns all essential playing status data in the Spotify object.
 */
const getPlayingStatus = computed(() => {
  const isSpotify = user.data?.spotify !== null

  if (isSpotify) {
    const {
      song,
      artist,
      album,
      timestamps,
      album_art_url: image,
      track_id: trackId,
    } = user.data?.spotify || {}
    const formattedArtist = artist?.split(";").map((name) => name.trim()).join(", ")

    return {
      timestamps,
      name: song,
      details: formattedArtist,
      state: album,
      largeImage: image,
      spotify: true,
      trackId,
    }
  } else {
    const { details, state, name, application_id, assets, timestamps } =
      user.data?.activities?.filter((activity) => activity.type === 0)?.pop() ||
      {}

    let largeImage, smallImage

    if (application_id) {
      if (assets?.large_image)
        largeImage = `https://cdn.discordapp.com/app-assets/${application_id}/${assets.large_image}.png`

      if (assets?.small_image)
        smallImage = `https://cdn.discordapp.com/app-assets/${application_id}/${assets.small_image}.png`
    }

    return {
      details,
      state,
      name,
      largeImage,
      smallImage,
      timestamps,
    }
  }
})

// Watchers
watchEffect(() => {
  useTitle(`${getUser.value.username}'s Status - Lanyard Visualizer`)
  useFavicon(getUser.value.avatar)
})

// Connect to Lanyard socket when the app is mounted
const userId = "573876541822599199"

if (userId.length < 17) user.error = true
else {
  const { send, close } = useWebSocket("wss://api.lanyard.rest/socket", {
    immediate: true,

    // Keep reconnecting with small backoff so users don't need manual reloads.
    autoReconnect: {
      retries: Number.POSITIVE_INFINITY,
      delay: 2000,
    },

    // Subscribe to the user WS is connected
    onConnected() {
      user.error = false
      send(
        JSON.stringify({
          op: 2,
          d: {
            subscribe_to_id: userId,
          },
        }),
      )

      socketLoaded.value = true
    },

    // Set the reactive object to data from Lanyard
    onMessage(_, { data }) {
      const payload = JSON.parse(data)
      const { op, t: type, d: status } = payload

      // Use server-provided heartbeat interval to prevent 30s disconnect loops.
      if (op === 1 && typeof status?.heartbeat_interval === "number") {
        if (heartbeatInterval.value) window.clearInterval(heartbeatInterval.value)
        heartbeatInterval.value = window.setInterval(() => {
          send(
            JSON.stringify({
              op: 3,
            }),
          )
        }, status.heartbeat_interval)
      }

      if (["INIT_STATE", "PRESENCE_UPDATE"].includes(type)) user.data = status
    },

    onDisconnected() {
      socketLoaded.value = false
    },

    onError() {
      socketLoaded.value = false
    },
  })

  // Close the WS connection on route change
  onBeforeRouteLeave(() => {
    if (heartbeatInterval.value) {
      window.clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
    close()
  })

  onBeforeUnmount(() => {
    if (heartbeatInterval.value) {
      window.clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
    close()
  })
}
</script>

<template>
  <Transition name="fade" mode="out-in">
    <div
      class="flex flex-col justify-center w-full mx-auto px-8 md:px-0 h-screen space-y-4 md:w-4/12 2xl:w-4/12"
    >
      <!-- Title -->
      <div class="flex items-center">
        <div class="flex space-x-4 items-center">
          <div class="flex-shrink-0">
            <img
              :src="getUser.avatar || ''"
              class="rounded-full h-14 shadow-lg w-14"
              width="24"
              height="24"
              draggable="false"
              alt="user avatar"
              @load="imageError = false"
              @error="imageError = true"
            />
          </div>

          <h1 class="font-semibold text-xl leading-tight">
            Jann
          </h1>
        </div>
      </div>

      <!-- Card -->
      <div
        v-if="
          Object.values(getPlayingStatus || {}).filter((item) => item)?.length >
          0
        "
      >
        <Card
          :name="getPlayingStatus.name"
          :largeImage="getPlayingStatus.largeImage || ''"
          :smallImage="getPlayingStatus.smallImage || ''"
          :state="getPlayingStatus.state"
          :details="getPlayingStatus.details"
          :timestamps="getPlayingStatus.timestamps"
          :is-spotify="getPlayingStatus.spotify === true"
          :track-id="getPlayingStatus.trackId"
        />
      </div>

      <div v-else-if="isConnecting === false" class="rounded-lg bg-white/5 text-white/30 text-sm p-4">
        User is not playing anything.
      </div>

    </div>
  </Transition>
</template>
