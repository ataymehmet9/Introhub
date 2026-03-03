import dayjs from 'dayjs'
import parse from 'html-react-parser'
import { HiCheckCircle } from 'react-icons/hi'
import type { NotificationWithMetadata } from '@/schemas'
import { Button, Card, Timeline } from '@/components/ui'
import classNames from '@/utils/classNames'
import NotificationAvatar from '@/components/template/Notification/NotificationAvatar'

type SettingsNotificationsProps = {
  notifications: Array<NotificationWithMetadata>
  isLoading: boolean
  loadable: boolean
  onLoadMore: () => void
  onMarkAsRead: (id: number) => void
}

const UnixDateTime = ({ value }: { value: string }) => {
  return <>{dayjs(value).format('hh:mm A')}</>
}

const SettingsNotifications = ({
  notifications,
  isLoading,
  loadable,
  onLoadMore,
  onMarkAsRead,
}: SettingsNotificationsProps) => {
  return (
    <>
      <div className="mb-8">
        <Timeline>
          {!notifications.length ? (
            <Timeline.Item>No Notifications</Timeline.Item>
          ) : (
            notifications.map((notification, index) => (
              <Timeline.Item
                key={notification.id + index}
                media={<NotificationAvatar notification={notification} />}
              >
                <div className="mt-1">
                  <Card
                    className={classNames(
                      !notification.read &&
                        'border-primary bg-primary/5 shadow-md',
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <h4>{notification.title}</h4>
                      </div>
                      <span className="ml-1 rtl:mr-1 md:ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime
                          value={notification.createdAt.toUTCString()}
                        />
                      </span>
                    </div>
                    <p className="py-4">{parse(notification.message)}</p>
                    {!notification.read && (
                      <div className="flex items-center justify-end">
                        <Button
                          icon={<HiCheckCircle />}
                          size="xs"
                          variant="default"
                          shape="round"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          <span>Mark as read</span>
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              </Timeline.Item>
            ))
          )}
        </Timeline>
      </div>
      <div className="text-center">
        {loadable ? (
          <Button loading={isLoading} onClick={onLoadMore}>
            Load More
          </Button>
        ) : (
          'No more notifications to load'
        )}
      </div>
    </>
  )
}

export default SettingsNotifications
