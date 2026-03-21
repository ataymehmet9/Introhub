// CSV parsing helper
export const parseCSV = (csvContent: string): Array<Record<string, string>> => {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row',
    )
  }

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: Array<Record<string, string>> = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    if (values.length !== headers.length) {
      continue // Skip malformed rows
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    rows.push(row)
  }

  return rows
}

// Validate CSV file format
export const validateCSVFile = (
  file: File,
): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'Please upload a CSV file' }
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' }
  }

  return { valid: true }
}

export const generateFileCloudUrl = (fileName: string | undefined | null) => {
  if (!fileName) return ''
  if (fileName.startsWith('blob:')) return fileName

  // If it's already a full URL (from OAuth providers), return as-is
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName
  }

  const bucketName = import.meta.env.VITE_BETTER_UPLOAD_BUCKET_NAME as string
  const region = import.meta.env.VITE_BETTER_UPLOAD_BUCKET_REGION as string
  return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`
}
