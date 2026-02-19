'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'

interface SampleReportActionsProps {
  startDate: string
  endDate: string
}

export function SampleReportActions({ startDate, endDate }: SampleReportActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/reports/sample/download')
      if (!response.ok) {
        throw new Error('PDF 생성에 실패했습니다')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `바투_예시_주간리포트_${startDate}_${endDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('PDF 다운로드에 실패했습니다')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    alert('예시 보고서는 공유할 수 없습니다.\n실제 보고서를 생성한 후 공유하세요.')
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleShare}>
        <Share2 className="mr-1 h-4 w-4" />
        공유
      </Button>
      <Button onClick={handleDownload} disabled={isDownloading}>
        <Download className="mr-1 h-4 w-4" />
        {isDownloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
      </Button>
    </div>
  )
}
