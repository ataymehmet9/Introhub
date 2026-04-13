import { Link } from '@tanstack/react-router'
import Container from '@/components/shared/Container'
import classNames from '@/utils/classNames'
import { APP_NAME } from '@/constants/app.constant'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'

export type FooterPageContainerType = 'gutterless' | 'contained'

type FooterProps = {
  pageContainerType: FooterPageContainerType
  className?: string
}

const FooterContent = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 flex-auto w-full text-center sm:text-left">
      <span className="text-xs sm:text-sm">
        Copyright &copy; {`${new Date().getFullYear()}`}{' '}
        <span className="font-semibold">{`${APP_NAME}`}</span> All rights
        reserved.
      </span>
      <div className="text-xs sm:text-sm">
        <Link className="text-gray" to="/terms-and-conditions">
          Term & Conditions
        </Link>
        <span className="mx-2 text-muted"> | </span>
        <Link className="text-gray" to="/privacy-policy">
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}

export default function Footer({
  pageContainerType = 'contained',
  className,
}: FooterProps) {
  return (
    <footer
      className={classNames(
        `footer flex flex-auto items-center min-h-16 py-3 ${PAGE_CONTAINER_GUTTER_X}`,
        className,
      )}
    >
      {pageContainerType === 'contained' ? (
        <Container>
          <FooterContent />
        </Container>
      ) : (
        <FooterContent />
      )}
    </footer>
  )
}
