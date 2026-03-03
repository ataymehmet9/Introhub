import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { TbSearch, TbX } from 'react-icons/tb'
import { Button, Input } from '@/components/ui'

interface SearchBarProps {
  placeholder?: string
  debounceMs?: number
}

const SearchBar = ({
  placeholder = 'Search by name, company, or position...',
  debounceMs = 300,
}: SearchBarProps) => {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/_authenticated/(search)/search' })
  const urlQuery = (searchParams.q as string) || ''

  const [localQuery, setLocalQuery] = useState(urlQuery)

  // Sync local state with URL params when they change externally
  useEffect(() => {
    setLocalQuery(urlQuery)
  }, [urlQuery])

  // Debounced URL update effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== urlQuery) {
        navigate({
          to: '/search',
          search: localQuery ? { q: localQuery } : {},
          replace: true,
        })
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localQuery, urlQuery, navigate, debounceMs])

  const handleClear = useCallback(() => {
    setLocalQuery('')
    navigate({
      to: '/search',
      search: {},
      replace: true,
    })
  }, [navigate])

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder={placeholder}
        prefix={<TbSearch className="text-xl" />}
        suffix={
          localQuery && (
            <Button
              size="xs"
              variant="plain"
              icon={<TbX />}
              onClick={handleClear}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            />
          )
        }
        className="w-full"
      />
      {localQuery.length > 0 && localQuery.length < 2 && (
        <p className="text-xs text-red-500 mt-1">
          Please enter at least 2 characters to search
        </p>
      )}
    </div>
  )
}

export default SearchBar
