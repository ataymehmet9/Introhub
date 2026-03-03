import { useState, useRef, useEffect } from 'react'
import { Button, Dialog, Card, Tabs, Alert, Progress } from '@/components/ui'
import {
  HiCloudArrowUp,
  HiDocumentArrowDown,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi2'
import ContactForm, {
  ContactFormHandle,
} from '@/components/shared/common/ContactForm'
import { InsertContact } from '@/schemas'
import { validateCSVFile } from '@/utils/fileUtils'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

interface ContactImportModalProps {
  isOpen: boolean
  onClose: () => void
  onContactAdded: (data: InsertContact) => Promise<void>
  onBulkImportComplete: () => void
}

// Custom hook for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export default function ContactImportModal({
  isOpen,
  onClose,
  onContactAdded,
  onBulkImportComplete,
}: ContactImportModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<ContactFormHandle>(null)

  const isMobile = useMediaQuery('(max-width: 1023px)')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('single')
      setFile(null)
      setResult(null)
      setError(null)
      setImporting(false)
    }
  }, [isOpen])

  // Auto-import when file is selected
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file
    const validation = validateCSVFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)

    // Auto-import immediately
    await handleImport(selectedFile)
  }

  const handleImport = async (fileToImport: File) => {
    setImporting(true)
    setError(null)
    setResult(null)

    try {
      // Read file content
      const csvContent = await fileToImport.text()

      // Call tRPC batch upload endpoint with options
      const response = await trpcClient.contacts.batchUpload.mutate({
        csvContent,
        skipDuplicates,
        updateExisting,
      })

      // Map response to ImportResult format
      const importResult: ImportResult = {
        imported: response.data.insertedCount,
        updated: response.data.updatedCount || 0,
        skipped: response.data.skippedCount || 0,
        errors:
          response.data.errors?.map((err) => ({
            row: err.row,
            message: err.error,
          })) || [],
      }

      setResult(importResult)
      onBulkImportComplete()

      // Auto-close modal after 2 seconds on success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import contacts')
    } finally {
      setImporting(false)
    }
  }

  const handleAddContact = async () => {
    if (formRef.current) {
      setIsSubmitting(true)
      try {
        // Trigger form submission through ref
        formRef.current.submit()
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleFormSubmit = async (data: InsertContact) => {
    await onContactAdded(data)
    onClose()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && fileInputRef.current) {
      // Create a new FileList-like object
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(droppedFile)
      fileInputRef.current.files = dataTransfer.files

      // Trigger change event
      const event = new Event('change', { bubbles: true })
      fileInputRef.current.dispatchEvent(event)
    }
  }

  const handleDownloadTemplate = () => {
    // Create CSV template with headers and example data
    const csvTemplate = `email,name,company,position,notes,phone,linkedinUrl
john.doe@example.com,John Doe,Acme Corp,CEO,Met at conference,+1234567890,https://linkedin.com/in/johndoe
jane.smith@example.com,Jane Smith,Tech Inc,CTO,,+0987654321,
bob.jones@example.com,Bob Jones,StartupXYZ,Developer,Referred by John,,https://linkedin.com/in/bobjones`

    // Create blob and download
    const blob = new Blob([csvTemplate], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'contacts-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const renderBulkUploadSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Bulk Upload</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload a CSV file to import multiple contacts at once
        </p>
      </div>

      {/* Download Template */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-100">
            Need a template?
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Download our CSV template to get started
          </p>
        </div>
        <Button
          variant="plain"
          size="sm"
          onClick={handleDownloadTemplate}
          icon={<HiDocumentArrowDown />}
        >
          Download
        </Button>
      </div>

      {/* File Upload */}
      {!result && !importing && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <HiCloudArrowUp className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {file ? file.name : 'Click to upload or drag and drop CSV file'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max file size: 5MB
            </p>
          </label>
        </div>
      )}

      {/* Import Options */}
      {!result && !importing && (
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="skip-duplicates"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="skip-duplicates"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Skip duplicate contacts (by email)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="update-existing"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="update-existing"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Update existing contacts
            </label>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert type="danger" showIcon>
          {error}
        </Alert>
      )}

      {/* Import Progress */}
      {importing && (
        <div className="space-y-2">
          <Progress percent={100} showInfo={false} />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Importing contacts...
          </p>
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div className="space-y-4">
          <Alert type="success" showIcon>
            Import completed successfully! Modal will close automatically...
          </Alert>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <HiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {result.imported}
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Imported
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <HiCheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {result.updated}
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Updated
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <HiCheckCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {result.skipped}
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Skipped
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <HiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <span className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {result.errors.length}
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Errors
              </p>
            </div>
          </div>

          {/* Error Details */}
          {result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                Import Errors:
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                  >
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      width={isMobile ? undefined : 1400}
    >
      <div className="flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Add/Import Contacts
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isMobile ? (
            // Mobile: Tabbed layout
            <div className="space-y-6">
              <Tabs
                value={activeTab}
                onChange={(value) => setActiveTab(value as 'single' | 'bulk')}
              >
                <Tabs.TabList className="mb-6">
                  <Tabs.TabNav value="single">Single Contact</Tabs.TabNav>
                  <Tabs.TabNav value="bulk">Bulk Upload</Tabs.TabNav>
                </Tabs.TabList>

                <Tabs.TabContent value="single">
                  <Card className="p-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Single Contact
                      </h3>
                      <ContactForm
                        ref={formRef}
                        onSubmit={handleFormSubmit}
                        onCancel={onClose}
                        hideActions
                        isLoading={isSubmitting}
                      />
                    </div>
                  </Card>
                </Tabs.TabContent>

                <Tabs.TabContent value="bulk">
                  <Card className="p-6">{renderBulkUploadSection()}</Card>
                </Tabs.TabContent>
              </Tabs>
            </div>
          ) : (
            // Desktop: Side-by-side layout
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Single Contact Form */}
              <Card className="p-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Single Contact</h3>
                  <ContactForm
                    ref={formRef}
                    onSubmit={handleFormSubmit}
                    onCancel={onClose}
                    hideActions
                    isLoading={isSubmitting}
                  />
                </div>
              </Card>

              {/* Right: Bulk Upload */}
              <Card className="p-6">{renderBulkUploadSection()}</Card>
            </div>
          )}
        </div>

        {/* Footer - outside scrollable area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end gap-3">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            {(!isMobile || activeTab === 'single') && (
              <Button
                variant="solid"
                onClick={handleAddContact}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Add Contact
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
