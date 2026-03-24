import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFileUpload } from '../-hooks/useFileUpload'
import { useUser } from '../-hooks/useUser'
import type { UpdateUser as ProfileSchema } from '@/schemas/user.schema'
import { useSessionUser } from '@/store/authStore'
import { updateUserSchema as validationSchema } from '@/schemas/user.schema'
import { Avatar, Button, Form, FormItem, Input, Upload } from '@/components/ui'
import { generateFileCloudUrl } from '@/utils/fileUtils'

const SettingsProfile = () => {
  const { user: data } = useSessionUser()
  const { updateUser, isUpdating } = useUser()
  const [profileImg, setProfileImg] = useState<File | null>(null)

  const { upload, isPending: isUploading } = useFileUpload()

  const beforeUpload = (files: FileList | null) => {
    let valid: string | boolean = true

    const allowedFileType = ['image/jpeg', 'image/png']
    if (files) {
      for (const file of files) {
        if (!allowedFileType.includes(file.type)) {
          valid = 'Please upload a .jpeg or .png file!'
        }
      }
    }

    return valid
  }

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    getFieldState,
  } = useForm<ProfileSchema>({
    resolver: zodResolver(validationSchema),
    defaultValues: { ...data },
  })

  const onSubmit = async (values: ProfileSchema) => {
    const updateValues = { ...values }
    if (getFieldState('image').isDirty && profileImg) {
      await upload(profileImg, {
        onSuccess: (data) => {
          updateValues.image = data.file.objectInfo.key
          doSubmit(updateValues)
        },
      })
    } else {
      doSubmit(updateValues)
    }
  }

  const doSubmit = async (values: ProfileSchema) => {
    await updateUser(values)
  }

  return (
    <>
      <h4 className="mb-8">Personal information</h4>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8">
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-4">
                <Avatar
                  size={90}
                  className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                  icon={<HiOutlineUser />}
                  src={generateFileCloudUrl(field.value)}
                />
                <div className="flex items-center gap-2">
                  <Upload
                    showList={false}
                    uploadLimit={1}
                    beforeUpload={beforeUpload}
                    onChange={(files) => {
                      if (files.length > 0) {
                        const file = files[0]
                        // Create preview URL
                        field.onChange(URL.createObjectURL(file))
                        setProfileImg(file)
                      }
                    }}
                  >
                    <Button
                      variant="solid"
                      size="sm"
                      type="button"
                      icon={<TbPlus />}
                      loading={isUploading}
                    >
                      Upload Image
                    </Button>
                  </Upload>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => {
                      field.onChange('')
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
        <FormItem
          className="w-full"
          label="Name"
          invalid={Boolean(errors.name)}
          errorMessage={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="First Name"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Email"
          invalid={Boolean(errors.email)}
          errorMessage={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                autoComplete="off"
                placeholder="Email"
                {...field}
              />
            )}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem
            label="Company"
            invalid={Boolean(errors.company)}
            errorMessage={errors.company?.message}
          >
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="Company"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Position"
            invalid={Boolean(errors.position)}
            errorMessage={errors.position?.message}
          >
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="Position"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </FormItem>
        </div>
        <div className="flex justify-end">
          <Button
            variant="solid"
            type="submit"
            loading={isSubmitting || isUploading || isUpdating}
          >
            Save
          </Button>
        </div>
      </Form>
    </>
  )
}

export default SettingsProfile
