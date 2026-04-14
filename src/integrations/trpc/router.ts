import { createTRPCRouter } from './init'
import {
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
})
export type TRPCRouter = typeof trpcRouter
