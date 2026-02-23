import routes from "./routes"
import App from "./App.vue"
import "./tailwind.css"

import { createApp } from "vue"
import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount("#app")
