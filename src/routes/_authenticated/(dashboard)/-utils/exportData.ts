import type { DashboardStats, TopContacts, TrendData } from '@/schemas'

/**
 * Convert dashboard data to CSV format
 */
export function exportDashboardToCSV(
  stats: DashboardStats | undefined,
  trends: TrendData | undefined,
  topContacts: TopContacts | undefined,
): string {
  if (!stats) return ''

  const lines: Array<string> = []

  // Header
  lines.push('IntroHub Dashboard Export')
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push(
    `Period: ${stats.dateRange.start.toLocaleDateString()} - ${stats.dateRange.end.toLocaleDateString()}`,
  )
  lines.push('')

  // Current Period Stats
  lines.push('CURRENT PERIOD STATISTICS')
  lines.push('Metric,Value,Change vs Previous Period')
  lines.push(
    `Total Contacts,${stats.stats.current.totalContacts},${stats.stats.changes.totalContacts.toFixed(1)}%`,
  )
  lines.push(
    `Requests Made,${stats.stats.current.requestsMade},${stats.stats.changes.requestsMade.toFixed(1)}%`,
  )
  lines.push(
    `Requests Received,${stats.stats.current.requestsReceived},${stats.stats.changes.requestsReceived.toFixed(1)}%`,
  )
  lines.push(
    `Approval Rate,${stats.stats.current.approvalRate.toFixed(1)}%,${stats.stats.changes.approvalRate.toFixed(1)}%`,
  )
  lines.push(
    `Rejection Rate,${stats.stats.current.rejectionRate.toFixed(1)}%,${stats.stats.changes.rejectionRate.toFixed(1)}%`,
  )
  lines.push(
    `Avg Response Time (Received),${stats.stats.current.avgResponseTimeReceived?.formatted || 'N/A'},${stats.stats.changes.avgResponseTimeReceived?.toFixed(1) || 'N/A'}%`,
  )
  lines.push(
    `Avg Response Time (Made),${stats.stats.current.avgResponseTimeMade?.formatted || 'N/A'},${stats.stats.changes.avgResponseTimeMade?.toFixed(1) || 'N/A'}%`,
  )
  lines.push('')

  // Status Breakdown
  lines.push('REQUEST STATUS BREAKDOWN')
  lines.push('Status,Count,Percentage')
  lines.push(
    `Pending,${stats.statusBreakdown.pending},${stats.statusBreakdown.pendingPercentage.toFixed(1)}%`,
  )
  lines.push(
    `Approved,${stats.statusBreakdown.approved},${stats.statusBreakdown.approvedPercentage.toFixed(1)}%`,
  )
  lines.push(
    `Declined,${stats.statusBreakdown.declined},${stats.statusBreakdown.declinedPercentage.toFixed(1)}%`,
  )
  lines.push(`Total,${stats.statusBreakdown.total},100%`)
  lines.push('')

  // Trend Data
  if (trends?.dataPoints && trends.dataPoints.length > 0) {
    lines.push('TREND DATA')
    lines.push('Date,Requests Made,Requests Received,Approved,Declined,Pending')
    trends.dataPoints.forEach((point) => {
      lines.push(
        `${point.date},${point.requestsMade},${point.requestsReceived},${point.requestsApproved},${point.requestsDeclined},${point.requestsPending}`,
      )
    })
    lines.push('')
  }

  // Top Contacts
  if (topContacts?.contacts && topContacts.contacts.length > 0) {
    lines.push('TOP CONTACTS')
    lines.push('Name,Email,Company,Total Requests,Approved,Declined,Pending')
    topContacts.contacts.forEach((contact) => {
      lines.push(
        `"${contact.contactName}","${contact.contactEmail}","${contact.contactCompany || ''}",${contact.requestCount},${contact.approvedCount},${contact.declinedCount},${contact.pendingCount}`,
      )
    })
  }

  return lines.join('\n')
}

/**
 * Export top contacts to CSV
 */
export function exportTopContactsToCSV(
  topContacts: TopContacts | undefined,
): string {
  if (!topContacts?.contacts || topContacts.contacts.length === 0) {
    return 'No data to export'
  }

  const lines: Array<string> = []

  lines.push('IntroHub Top Contacts Export')
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push('')
  lines.push('Name,Email,Company,Total Requests,Approved,Declined,Pending')

  topContacts.contacts.forEach((contact) => {
    lines.push(
      `"${contact.contactName}","${contact.contactEmail}","${contact.contactCompany || ''}",${contact.requestCount},${contact.approvedCount},${contact.declinedCount},${contact.pendingCount}`,
    )
  })

  return lines.join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(prefix: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `${prefix}_${timestamp}.csv`
}
