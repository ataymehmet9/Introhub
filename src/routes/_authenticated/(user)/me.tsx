import { Outlet, createFileRoute } from '@tanstack/react-router'
import SettingsMenu from './me/-components/SettingsMenu'
import SettingMobileMenu from './me/-components/SettingsMobileMenu'
import useResponsive from '@/utils/hooks/useResponsive'
import { AdaptiveCard } from '@/components/shared'

export const Route = createFileRoute('/_authenticated/(user)/me')({
  component: RouteComponent,
})

function RouteComponent() {
  const { smaller, larger } = useResponsive()

  return (
    <AdaptiveCard className="h-full">
      <div className="flex flex-auto h-full">
        {larger.xl && (
          <div className="'w-[200px] xl:w-[280px]">
            <SettingsMenu />
          </div>
        )}
        <div className="xl:ltr:pl-6 xl:rtl:pr-6 flex-1 py-2">
          {smaller.xl && (
            <div className="mb-6">
              <SettingMobileMenu />
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </AdaptiveCard>
  )
}
