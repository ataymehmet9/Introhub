import classNames from 'classnames'
import { Link } from '@tanstack/react-router'
import type { CommonProps } from '@/@types/common'
import { APP_NAME } from '@/constants/app.constant'

interface LogoProps extends CommonProps {
  link?: string
  type?: 'full' | 'streamline'
  mode?: 'light' | 'dark'
  imgClass?: string
  logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
  const {
    link,
    type = 'full',
    mode = 'light',
    className,
    imgClass,
    style,
    logoWidth = 'auto',
  } = props

  const img = (
    <img
      className={imgClass}
      src={`${LOGO_SRC_PATH}logo-${mode}-${type}.png`}
      alt={`${APP_NAME} logo`}
    />
  )

  return (
    <div
      className={classNames('logo', className)}
      style={{
        ...(style || {}),
        ...{ width: logoWidth },
      }}
    >
      {link ? <Link to={link}>{img}</Link> : img}
    </div>
  )
}

export default Logo
