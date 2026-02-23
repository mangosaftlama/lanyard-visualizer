// Import routes
import UserComponent from "./views/[id].vue"

// Import types
import { RouteRecordRaw } from "vue-router"

const RouterConfig: RouteRecordRaw[] = [
  {
    path: "/",
    name: "User",
    component: UserComponent,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
]

// Export router config
export default RouterConfig
