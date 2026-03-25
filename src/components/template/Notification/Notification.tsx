import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import classNames from 'classnames'
import { formatDistanceToNow } from 'date-fns'
import { HiOutlineMailOpen } from 'react-icons/hi'
import NotificationToggle from './NotificationToggle'
import NotificationAvatar from './NotificationAvatar'
import type { DropdownRef } from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import isLastChild from '@/utils/isLastChild'
import useResponsive from '@/utils/hooks/useResponsive'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationSSE } from '@/hooks/useNotificationSSE'

const notificationHeight = 'h-[280px]'

const Notification = ({ className }: { className?: string }) => {
  const { larger } = useResponsive()
  const notificationDropdownRef = useRef<DropdownRef>(null)

  // Use our notification hook with real-time SSE updates
  const {
    notifications,
    unreadCount,
    hasUnread,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  useNotificationSSE()

  const onMarkAllAsRead = () => {
    markAllAsRead()
  }

  const onMarkAsRead = (id: number) => {
    markAsRead(id)
  }

  const handleViewAllActivity = () => {
    // TODO: Navigate to notifications page when created
    // navigate({ to: '/notifications' })
    if (notificationDropdownRef.current) {
      notificationDropdownRef.current.handleDropdownClose()
    }
  }

  return (
    <Dropdown
      ref={notificationDropdownRef}
      renderTitle={<NotificationToggle dot={hasUnread} className={className} />}
      menuClass="min-w-[280px] md:min-w-[340px]"
      placement={larger.md ? 'bottom-end' : 'bottom'}
    >
      <Dropdown.Item variant="header">
        <div className="dark:border-gray-700 px-2 flex items-center justify-between mb-1">
          <h6>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                ({unreadCount} unread)
              </span>
            )}
          </h6>
          {unreadCount > 0 && (
            <Button
              variant="plain"
              shape="circle"
              size="sm"
              icon={<HiOutlineMailOpen className="text-xl" />}
              title="Mark all as read"
              onClick={onMarkAllAsRead}
            />
          )}
        </div>
      </Dropdown.Item>
      <ScrollBar className={classNames('overflow-y-auto', notificationHeight)}>
        {isLoading && notifications.length === 0 && (
          <div
            className={classNames(
              'flex items-center justify-center',
              notificationHeight,
            )}
          >
            <Spinner size={40} />
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div
            className={classNames(
              'flex items-center justify-center',
              notificationHeight,
            )}
          >
            <div className="text-center">
              <img
                className="mx-auto mb-2 max-w-[150px]"
                src="/img/others/no-notification.png"
                alt="no-notification"
              />
              <h6 className="font-semibold">No notifications!</h6>
              <p className="mt-1">You're all caught up</p>
            </div>
          </div>
        )}
        {notifications.length > 0 &&
          notifications.map((notification, index) => (
            <div key={notification.id}>
              <div
                className={classNames(
                  'relative rounded-xl flex px-4 py-3 cursor-pointer hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700',
                  {
                    'bg-blue-50 dark:bg-blue-900/20': !notification.read,
                  },
                )}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="text-2xl mr-3">
                  <NotificationAvatar notification={notification} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold heading-text mb-1">
                    {notification.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <Badge
                  className="absolute top-4 ltr:right-4 rtl:left-4 mt-1.5"
                  innerClass={`${
                    notification.read
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-primary'
                  } `}
                />
              </div>
              {!isLastChild(notifications, index) && (
                <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
              )}
            </div>
          ))}
      </ScrollBar>
      <Dropdown.Item variant="header">
        <div className="pt-4">
          <Button
            block
            variant="solid"
            onClick={handleViewAllActivity}
            asElement={Link}
            to="/me/notifications"
            className="text-center block"
          >
            View All Activity
          </Button>
        </div>
      </Dropdown.Item>
    </Dropdown>
  )
}

const _Notification = withHeaderItem(Notification)

export default _Notification
