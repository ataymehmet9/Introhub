import { PiBellDuotone } from 'react-icons/pi'
import classNames from '@/utils/classNames'
import Badge from '@/components/ui/Badge'

const NotificationToggle = ({
  className,
  dot,
}: {
  className?: string
  dot?: number
}) => {
  return (
    <div className={classNames('text-2xl', className)}>
      {dot ? (
        <Badge content={dot} maxCount={9}>
          <PiBellDuotone />
        </Badge>
      ) : (
        <PiBellDuotone />
      )}
    </div>
  )
}

export default NotificationToggle
