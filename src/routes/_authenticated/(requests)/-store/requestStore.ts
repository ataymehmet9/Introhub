import { create } from 'zustand'

export type IntroductionRequestWithDetails = {
  id: number
  message: string
  status: 'pending' | 'approved' | 'declined'
  responseMessage: string | null
  createdAt: Date
  updatedAt: Date
  requesterId: string
  requesterName: string
  requesterEmail: string
  requesterCompany: string | null
  approverId: string
  approverName: string
  approverEmail: string
  approverCompany: string | null
  targetContactId: number
  targetContactName: string
  targetContactEmail: string
  targetContactCompany: string | null
  targetContactPosition: string | null
}

type RequestStore = {
  selectedRequests: Array<IntroductionRequestWithDetails>
  setSelectedRequest: (
    checked: boolean,
    request: IntroductionRequestWithDetails,
  ) => void
  setSelectAllRequests: (requests: Array<IntroductionRequestWithDetails>) => void
}

export const useRequestStore = create<RequestStore>((set) => ({
  selectedRequests: [],
  setSelectedRequest: (checked, request) =>
    set((state) => ({
      selectedRequests: checked
        ? [...state.selectedRequests, request]
        : state.selectedRequests.filter((r) => r.id !== request.id),
    })),
  setSelectAllRequests: (requests) =>
    set(() => ({
      selectedRequests: requests,
    })),
}))
