import { createTRPCRouter } from './init'
import {
  contactRouter,
  dashboardRouter,
  introductionRequestRouter,
  notificationRouter,
  searchRouter,
  userRouter,
} from './routes'

export const trpcRouter = createTRPCRouter({
  contacts: contactRouter,
  users: userRouter,
  search: searchRouter,
  introductionRequests: introductionRequestRouter,
  notifications: notificationRouter,
  dashboard: dashboardRouter,
})
export type TRPCRouter = typeof trpcRouter
