import {
  PiArrowsLeftRightBold,
  PiHouseLineDuotone,
  PiMagnifyingGlassBold,
  PiUsersDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
  home: <PiHouseLineDuotone />,
  contacts: <PiUsersDuotone />,
  search: <PiMagnifyingGlassBold />,
  requests: <PiArrowsLeftRightBold />,
}

export default navigationIcon
