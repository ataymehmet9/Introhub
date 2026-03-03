import { useCallback, useEffect, useRef, useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import classNames from '../utils/classNames'
import Button from '../Button/Button'
import CloseButton from '../CloseButton'
import Notification from '../Notification/Notification'
import toast from '../toast/toast'
import FileItem from './FileItem'
import type { CommonProps } from '../@types/common'
import type { ChangeEvent, MouseEvent, ReactNode, Ref } from 'react'

export interface UploadProps extends CommonProps {
  accept?: string
  beforeUpload?: (file: FileList | null, fileList: Array<File>) => boolean | string
  disabled?: boolean
  draggable?: boolean
  fileList?: Array<File>
  fileListClass?: string
  fileItemClass?: string
  multiple?: boolean
  onChange?: (file: Array<File>, fileList: Array<File>) => void
  onFileRemove?: (file: Array<File>) => void
  ref?: Ref<HTMLDivElement>
  showList?: boolean
  tip?: string | ReactNode
  uploadLimit?: number
}

const filesToArray = (files: Array<File>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.keys(files).map((key) => files[key as any])

const Upload = (props: UploadProps) => {
  const {
    accept,
    beforeUpload,
    disabled = false,
    draggable = false,
    fileList = [],
    fileListClass,
    fileItemClass,
    multiple,
    onChange,
    onFileRemove,
    ref,
    showList = true,
    tip,
    uploadLimit,
    children,
    className,
    ...rest
  } = props

  const fileInputField = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState(fileList)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (JSON.stringify(files) !== JSON.stringify(fileList)) {
      setFiles(fileList)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fileList)])

  const triggerMessage = (msg: string | ReactNode = '') => {
    toast.push(
      <Notification type="danger" duration={2000}>
        {msg || 'Upload Failed!'}
      </Notification>,
      {
        placement: 'top-center',
      },
    )
  }

  const pushFile = (newFiles: FileList | null, file: Array<File>) => {
    if (newFiles) {
      for (const f of newFiles) {
        file.push(f)
      }
    }

    return file
  }

  const addNewFiles = (newFiles: FileList | null) => {
    let file = cloneDeep(files)
    if (typeof uploadLimit === 'number' && uploadLimit !== 0) {
      if (Object.keys(file).length >= uploadLimit) {
        if (uploadLimit === 1) {
          file.shift()
          file = pushFile(newFiles, file)
        }

        return filesToArray({ ...file })
      }
    }
    file = pushFile(newFiles, file)
    return filesToArray({ ...file })
  }

  const onNewFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files: newFiles } = e.target
    let result: boolean | string = true

    if (beforeUpload) {
      result = beforeUpload(newFiles, files)

      if (result === false) {
        triggerMessage()
        return
      }

      if (typeof result === 'string' && result.length > 0) {
        triggerMessage(result)
        return
      }
    }

    if (result) {
      const updatedFiles = addNewFiles(newFiles)
      setFiles(updatedFiles)
      onChange?.(updatedFiles, files)
    }
  }

  const removeFile = (fileIndex: number) => {
    const deletedFileList = files.filter((_, index) => index !== fileIndex)
    setFiles(deletedFileList)
    onFileRemove?.(deletedFileList)
  }

  const triggerUpload = (e: MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      fileInputField.current?.click()
    }
    e.stopPropagation()
  }

  const renderChildren = () => {
    if (!draggable && !children) {
      return (
        <Button disabled={disabled} onClick={(e) => e.preventDefault()}>
          Upload
        </Button>
      )
    }

    if (draggable && !children) {
      return <span>Choose a file or drag and drop here</span>
    }

    return children
  }

  const handleDragLeave = useCallback(() => {
    if (draggable) {
      setDragOver(false)
    }
  }, [draggable])

  const handleDragOver = useCallback(() => {
    if (draggable && !disabled) {
      setDragOver(true)
    }
  }, [draggable, disabled])

  const handleDrop = useCallback(() => {
    if (draggable) {
      setDragOver(false)
    }
  }, [draggable])

  const draggableProp = {
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  const draggableEventFeedbackClass = `border-primary`

  const uploadClass = classNames(
    'upload',
    draggable && `upload-draggable`,
    draggable && !disabled && `hover:${draggableEventFeedbackClass}`,
    draggable && disabled && 'disabled',
    dragOver && draggableEventFeedbackClass,
    className,
  )

  const uploadInputClass = classNames('upload-input', draggable && `draggable`)

  return (
    <>
      <div
        ref={ref}
        className={uploadClass}
        {...(draggable ? draggableProp : { onClick: triggerUpload })}
        {...rest}
      >
        <input
          ref={fileInputField}
          className={uploadInputClass}
          type="file"
          disabled={disabled}
          multiple={multiple}
          accept={accept}
          title=""
          value=""
          onChange={onNewFileUpload}
          {...rest}
        ></input>
        {renderChildren()}
      </div>
      {tip}
      {showList && (
        <div className={classNames('upload-file-list', fileListClass)}>
          {files.map((file, index) => (
            <FileItem
              key={file.name + index}
              file={file}
              className={fileItemClass}
            >
              <CloseButton
                className="upload-file-remove"
                onClick={() => removeFile(index)}
              />
            </FileItem>
          ))}
        </div>
      )}
    </>
  )
}

export default Upload
