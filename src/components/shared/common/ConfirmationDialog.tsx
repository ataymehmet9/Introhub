import React from 'react'
import { HiExclamationCircle, HiInformationCircle } from 'react-icons/hi2'
import type { ConfirmationDialogProps } from '@/@types/intro-hub'
import { Button, Dialog } from '@/components/ui'

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <HiExclamationCircle className="text-red-500 text-5xl" />
      case 'warning':
        return <HiExclamationCircle className="text-yellow-500 text-5xl" />
      case 'info':
        return <HiInformationCircle className="text-blue-500 text-5xl" />
      default:
        return <HiInformationCircle className="text-blue-500 text-5xl" />
    }
  }

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <Dialog isOpen={open} onClose={onCancel} width={400}>
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{getIcon()}</div>

          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {title}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            <Button variant="default" onClick={onCancel} className="flex-1">
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${getConfirmButtonVariant()}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default ConfirmationDialog
