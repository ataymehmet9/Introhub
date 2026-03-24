import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ArticleContent } from '../-types/Content'

interface HelpContentContextType {
  content: ArticleContent | null
  setContent: (content: ArticleContent | null) => void
}

const HelpContentContext = createContext<HelpContentContextType | undefined>(
  undefined,
)

export function HelpContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ArticleContent | null>(null)

  return (
    <HelpContentContext.Provider value={{ content, setContent }}>
      {children}
    </HelpContentContext.Provider>
  )
}

export function useHelpContentContext() {
  const context = useContext(HelpContentContext)
  if (context === undefined) {
    throw new Error(
      'useHelpContentContext must be used within a HelpContentProvider',
    )
  }
  return context
}
