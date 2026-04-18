import { createTRPCRouter } from './init'
import {
  aiRouter,
  billingRouter,
  contactRouter,
  crmRouter,
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
  billing: billingRouter,
  crm: crmRouter,
  ai: aiRouter,
})
export type TRPCRouter = typeof trpcRouter
