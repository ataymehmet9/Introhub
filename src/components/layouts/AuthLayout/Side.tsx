import type { CommonProps } from '@/@types/common'

type SideProps = CommonProps

const Side = ({ children }: SideProps) => {
  return (
    <div className="flex min-h-screen p-6 bg-white dark:bg-gray-800">
      <div className=" flex flex-col justify-center items-center flex-1">
        <div className="w-full xl:max-w-[450px] px-8 max-w-[380px]">
          {children}
        </div>
      </div>
      <div className="py-6 px-10 lg:flex flex-col flex-1 justify-between hidden rounded-3xl items-end relative xl:max-w-[520px] 2xl:max-w-[720px]">
        <img
          src="/img/others/auth-side-bg.png"
          alt="Authentication background"
          className="absolute h-full w-full top-0 left-0 rounded-3xl"
        />
      </div>
    </div>
  )
}

export default Side
