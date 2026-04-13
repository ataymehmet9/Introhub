import { Switcher } from '@/components/ui'

type SettingsLogActionProps = {
  showUnreadOnly?: boolean
  onFilterChange: (unreadOnly: boolean) => void
}

const SettingsLogAction = ({
  showUnreadOnly = false,
  onFilterChange,
}: SettingsLogActionProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm sm:text-base font-semibold">
        Show unread only?
      </span>
      <Switcher checked={showUnreadOnly} onChange={onFilterChange} />
    </div>
  )
}

export default SettingsLogAction
