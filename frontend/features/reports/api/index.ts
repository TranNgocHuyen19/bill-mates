import http from '@/services/api'

import type { ReportExport, ReportFilters, RoomReport } from '../schemas'

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function getExportFilename(contentDisposition: string | undefined, filters: ReportFilters): string {
  const utf8Filename = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const basicFilename = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
  let filename = `billmates-report-${filters.fromDate}-${filters.toDate}.xlsx`

  if (utf8Filename) {
    try {
      filename = decodeURIComponent(utf8Filename)
    } catch {
      filename = utf8Filename
    }
  } else if (basicFilename) {
    filename = basicFilename
  }

  const safeFilename = filename.split(/[\\/]/).pop()?.trim() || 'billmates-report.xlsx'
  return safeFilename.toLowerCase().endsWith('.xlsx') ? safeFilename : `${safeFilename}.xlsx`
}

export async function getExpenseReportApi(filters: ReportFilters, signal?: AbortSignal): Promise<RoomReport> {
  const response = await http.get<RoomReport>(`/api/v1/rooms/${filters.roomId}/reports`, {
    params: {
      from_date: filters.fromDate,
      to_date: filters.toDate
    },
    signal
  })

  return response.data
}

export async function exportExpenseReportApi(filters: ReportFilters): Promise<ReportExport> {
  const response = await http.get<Blob>(`/api/v1/rooms/${filters.roomId}/reports/export`, {
    params: {
      from_date: filters.fromDate,
      to_date: filters.toDate
    },
    responseType: 'blob',
    headers: {
      Accept: XLSX_MIME_TYPE
    }
  })

  return {
    blob: response.data,
    filename: getExportFilename(response.headers['content-disposition'], filters)
  }
}
