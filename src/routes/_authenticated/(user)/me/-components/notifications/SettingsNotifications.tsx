import dayjs from 'dayjs'
import parse from 'html-react-parser'
import { useState } from 'react'
import {
  HiCheckCircle,
  HiChevronDown,
  HiChevronUp,
  HiMail,
} from 'react-icons/hi'
import { AnimatePresence, motion } from 'framer-motion'
import type { NotificationWithMetadata } from '@/schemas'
import { Button, Card, Timeline } from '@/components/ui'
import classNames from '@/utils/classNames'
import NotificationAvatar from '@/components/template/Notification/NotificationAvatar'
import { extractEmailBodyContent } from '@/utils/extractEmailBodyContent'

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

const EmailContentCard = ({ emailContent }: { emailContent: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract body content if the emailContent contains full HTML document
  // This handles backward compatibility with old notifications that have full HTML
  const bodyContent = extractEmailBodyContent(emailContent)

  return (
    <div className="mt-4 min-w-0">
      <style>{`
        .email-content-wrapper * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .email-content-wrapper table {
          width: 100% !important;
          table-layout: fixed !important;
        }
        .email-content-wrapper img {
          max-width: 100% !important;
          height: auto !important;
        }
      `}</style>
      <Button
        variant="plain"
        size="sm"
        className="flex items-center gap-2 text-primary hover:text-primary-dark"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <HiMail className="text-lg" />
        <span>Email Sent</span>
        {isExpanded ? (
          <HiChevronUp className="text-lg" />
        ) : (
          <HiChevronDown className="text-lg" />
        )}
      </Button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Card className="mt-3 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-l-primary overflow-hidden min-w-0 max-w-full">
              <div
                className="email-content-wrapper prose prose-sm dark:prose-invert overflow-x-auto break-words min-w-0 max-w-full"
                style={{
                  maxWidth: '100%',
                  width: '100%',
                }}
              >
                <div style={{ maxWidth: '100%', overflow: 'auto' }}>
                  {parse(bodyContent)}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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
      <div className="mb-8 min-w-0 overflow-hidden">
        <Timeline className="min-w-0">
          {!notifications.length ? (
            <Timeline.Item>No Notifications</Timeline.Item>
          ) : (
            notifications.map((notification, index) => (
              <Timeline.Item
                key={notification.id + index}
                media={<NotificationAvatar notification={notification} />}
                className="min-w-0"
              >
                <div className="mt-1 min-w-0">
                  <Card
                    className={classNames(
                      'min-w-0',
                      !notification.read &&
                        'border-primary bg-primary/5 shadow-md',
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-base sm:text-lg font-semibold">
                          {notification.title}
                        </h5>
                      </div>
                      <span className="text-sm ml-1 rtl:mr-1 md:ml-3 md:rtl:mr-3 font-semibold whitespace-nowrap">
                        <UnixDateTime
                          value={notification.createdAt.toUTCString()}
                        />
                      </span>
                    </div>
                    <p className="py-4 text-sm sm:text-base">
                      {parse(notification.message)}
                    </p>
                    {notification.emailContent && (
                      <div className="min-w-0">
                        <EmailContentCard
                          emailContent={notification.emailContent}
                        />
                      </div>
                    )}
                    {!notification.read && (
                      <div className="flex items-center justify-end mt-4">
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
