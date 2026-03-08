import {
  LuCircleCheck,
  LuCircleUserRound,
  LuCircleX,
  LuMailbox,
} from 'react-icons/lu'
import type { Notification } from '@/schemas'
import Avatar from '@/components/ui/Avatar'

const NotificationAvatar = (props: { notification: Notification }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'introduction_request':
        return <LuCircleUserRound />
      case 'introduction_approved':
        return <LuCircleCheck />
      case 'introduction_declined':
        return <LuCircleX />
      default:
        return <LuMailbox />
    }
  }

  return (
    <Avatar
      shape="circle"
      icon={getNotificationIcon(props.notification.type)}
    />
  )
}

export default NotificationAvatar
