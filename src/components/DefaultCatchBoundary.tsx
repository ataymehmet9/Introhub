import { Link, rootRouteId, useMatch, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import Container from '@/components/shared/Container'
import SpaceSignBoard from '@/assets/svg/SpaceSignBoard'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <Container className="h-full">
      <div className="h-full flex flex-col items-center justify-center">
        <SpaceSignBoard height={280} width={280} />
        <div className="mt-10 text-center">
          <h3 className="mb-2">An error has occurred!</h3>
          <p className="text-base">{error.message}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => {
              router.invalidate()
            }}
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold`}
          >
            Try Again
          </button>
          {isRoot ? (
            <Link
              to="/"
              className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold`}
            >
              Home
            </Link>
          ) : (
            <Link
              to="/"
              className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold`}
              onClick={(e) => {
                e.preventDefault()
                window.history.back()
              }}
            >
              Go Back
            </Link>
          )}
        </div>
      </div>
    </Container>
  )
}
