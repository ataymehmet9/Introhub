import { Link, useLocation } from '@tanstack/react-router'
import { Menu, MenuItem, ScrollBar } from '@/components/ui'
import { userSettingsMenu as menuList } from '@/configs/navigation.config/user'

type SettingsMenuProps = {
  onChange?: () => void
}

const SettingsMenu = ({ onChange }: SettingsMenuProps) => {
  const { pathname: currentPath } = useLocation()

  const handleSelect = () => {
    onChange?.()
  }

  return (
    <div className="flex flex-col justify-between h-full">
      <ScrollBar className="h-full overflow-y-auto">
        <Menu className="mx-2 mb-10">
          {menuList.map((menu) => (
            <MenuItem
              key={menu.value}
              eventKey={menu.value}
              className={`mb-2 ${
                currentPath.endsWith(menu.value)
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : ''
              }`}
              isActive={currentPath.endsWith(menu.value)}
              asElement={Link}
              onSelect={() => handleSelect()}
              to={menu.path}
            >
              <span className="text-2xl ltr:mr-2 rtl:ml-2">{menu.icon}</span>
              <span>{menu.label}</span>
            </MenuItem>
          ))}
        </Menu>
      </ScrollBar>
    </div>
  )
}

export default SettingsMenu
