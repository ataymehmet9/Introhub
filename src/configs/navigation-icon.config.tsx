import {
  PiArrowsLeftRightBold,
  PiHouseLineDuotone,
  PiMagnifyingGlassBold,
  PiPlugs,
  PiUsersDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
  home: <PiHouseLineDuotone />,
  contacts: <PiUsersDuotone />,
  search: <PiMagnifyingGlassBold />,
  requests: <PiArrowsLeftRightBold />,
  integration: <PiPlugs />,
}

export default navigationIcon
