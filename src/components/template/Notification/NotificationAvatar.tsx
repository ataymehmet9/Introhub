import type { Notification } from '@/schemas'
import Avatar from '@/components/ui/Avatar'
import useDarkMode from '@/utils/hooks/useDarkMode'

const NotificationAvatar = (props: { notification: Notification }) => {
  const [isDark] = useDarkMode()
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'introduction_request':
        return '🤝'
      case 'introduction_approved':
        return '✅'
      case 'introduction_declined':
        return '❌'
      default:
        return '📬'
    }
  }

  return (
    <Avatar shape="circle" className={!isDark ? 'bg-gray-100' : ''}>
      {getNotificationIcon(props.notification.type)}
    </Avatar>
  )
}

export default NotificationAvatar
