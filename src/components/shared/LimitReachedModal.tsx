import { TbCrown } from 'react-icons/tb'
import { Link } from '@tanstack/react-router'
import { Button, Dialog } from '@/components/ui'

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  requestsUsed: number
  requestLimit: number
  nextResetDate: Date | null
}

export function LimitReachedModal({
  isOpen,
  onClose,
  requestsUsed,
  requestLimit,
  nextResetDate,
}: LimitReachedModalProps) {
  const formatResetDate = (date: Date | null) => {
    if (!date) return 'next month'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width={500} closable={false}>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-start p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle">
              <TbCrown className="text-2xl text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Monthly Limit Reached
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You've used all {requestLimit} requests this month
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Requests used
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {requestsUsed} / {requestLimit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: '100%' }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Your requests will reset on {formatResetDate(nextResetDate)}
            </p>
          </div>

          {/* Pro Benefits */}
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Upgrade to Pro for unlimited access
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <TbCrown className="mt-0.5 shrink-0 text-primary" />
                <span>Unlimited introduction requests</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <TbCrown className="mt-0.5 shrink-0 text-primary" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <TbCrown className="mt-0.5 shrink-0 text-primary" />
                <span>Advanced analytics</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to="/me/billing" className="flex-1">
              <Button
                variant="solid"
                block
                icon={<TbCrown />}
                onClick={onClose}
              >
                Upgrade to Pro
              </Button>
            </Link>
            <Button variant="plain" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

// Made with Bob
