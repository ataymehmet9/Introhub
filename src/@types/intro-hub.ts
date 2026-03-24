// Intro-Hub Type Definitions

import type {
  Contact,
  InsertContact,
  IntroductionRequest,
  User,
} from '@/schemas'

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

export interface RequestFormData {
  target_contact_id: number
  connector_id: number
  message: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  results: Array<T>
  count: number
  next?: string
  previous?: string
}

// Context types
export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (userData: SignupData) => Promise<void>
  logout: () => void
  updateUserProfile: (userData: Partial<User>) => void
}

export interface ContactContextType {
  contacts: Array<Contact>
  isLoading: boolean
  error: string | null
  fetchContacts: () => Promise<void>
  addContact: (contactData: InsertContact) => Promise<Contact>
  updateContact: (
    id: number,
    contactData: Partial<InsertContact>,
  ) => Promise<Contact>
  removeContact: (id: number) => Promise<void>
  searchContacts: (query: string) => Array<Contact>
}

export interface RequestContextType {
  sentRequests: Array<IntroductionRequest>
  receivedRequests: Array<IntroductionRequest>
  isLoading: boolean
  error: string | null
  fetchSentRequests: () => Promise<void>
  fetchReceivedRequests: () => Promise<void>
  createRequest: (requestData: RequestFormData) => Promise<IntroductionRequest>
  respondToRequest: (
    id: number,
    status: 'approved' | 'rejected',
    message?: string,
  ) => Promise<IntroductionRequest>
}

// Component prop types
export interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete?: (id: number) => void
}

export interface RequestCardProps {
  request: IntroductionRequest
  type: 'sent' | 'received'
  onRespond?: (
    id: number,
    status: 'approved' | 'rejected',
    message?: string,
  ) => void
}

export interface ConfirmationDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

// Form validation schemas (for Zod)
export interface LoginFormSchema {
  email: string
  password: string
}

export interface SignupFormSchema {
  email: string
  password: string
  confirmPassword: string
  first_name: string
  last_name: string
}

export interface ContactFormSchema {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  position: string
  linkedin_profile?: string
  relationship?: string
  notes?: string
}

export interface RequestFormSchema {
  target_contact_id: number
  connector_id: number
  message: string
}

// API Error types
export interface ApiError {
  message: string
  status: number
  details?: Record<string, Array<string>>
}

// Search and filter types
export interface ContactFilters {
  search?: string
  company?: string
  relationship?: string
  sortBy?: 'name' | 'company' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface RequestFilters {
  status?: IntroductionRequest['status']
  dateFrom?: string
  dateTo?: string
  sortBy?: 'created_at' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// Dashboard stats types
export interface DashboardStats {
  totalContacts: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  recentActivity: Array<{
    id: number
    type:
      | 'contact_added'
      | 'request_sent'
      | 'request_received'
      | 'request_approved'
    message: string
    timestamp: string
  }>
}
