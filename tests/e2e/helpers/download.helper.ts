/**
 * PDF 다운로드 캡처 헬퍼
 * E2E 테스트에서 PDF 다운로드 응답을 가로채서 검증
 */

import { Page, Response } from '@playwright/test'

export interface DownloadCapture {
  /** 캡처된 응답 */
  response: Response | null
  /** Content-Type 헤더 */
  contentType: string | null
  /** Content-Disposition 헤더 */
  contentDisposition: string | null
  /** Content-Length 헤더 */
  contentLength: number | null
  /** 응답 상태 코드 */
  status: number | null
  /** 응답 본문 크기 (bytes) */
  bodySize: number | null
}

/**
 * PDF 다운로드 응답을 캡처하는 헬퍼
 *
 * Usage: startListening(urlPattern) -> click download -> waitForDownload()
 */
export class DownloadHelper {
  private page: Page
  private capture: DownloadCapture = {
    response: null,
    contentType: null,
    contentDisposition: null,
    contentLength: null,
    status: null,
    bodySize: null,
  }
  private resolvePromise: ((value: DownloadCapture) => void) | null = null
  private downloadPromise: Promise<DownloadCapture> | null = null
  private responseHandler: ((response: Response) => Promise<void>) | null = null

  constructor(page: Page) {
    this.page = page
  }

  /**
   * 다운로드 URL 패턴에 대해 응답을 캡처하기 시작
   * @param urlPattern - 감시할 URL 패턴 (glob 또는 정규식 문자열)
   */
  async startListening(urlPattern: string | RegExp): Promise<void> {
    this.downloadPromise = new Promise<DownloadCapture>((resolve) => {
      this.resolvePromise = resolve
    })

    this.responseHandler = async (response: Response) => {
      const url = response.url()
      const matches =
        typeof urlPattern === 'string'
          ? this.globMatch(url, urlPattern)
          : urlPattern.test(url)

      if (matches && this.resolvePromise) {
        const headers = response.headers()
        let bodySize: number | null = null

        try {
          const body = await response.body()
          bodySize = body.length
        } catch {
          // body may not be available for downloads
        }

        this.capture = {
          response,
          contentType: headers['content-type'] || null,
          contentDisposition: headers['content-disposition'] || null,
          contentLength: headers['content-length'] ? parseInt(headers['content-length'], 10) : null,
          status: response.status(),
          bodySize,
        }

        this.resolvePromise(this.capture)
        this.resolvePromise = null
      }
    }

    this.page.on('response', this.responseHandler)
  }

  /**
   * 응답 리스너를 제거하여 리소스 누수를 방지
   */
  stopListening(): void {
    if (this.responseHandler) {
      this.page.off('response', this.responseHandler)
      this.responseHandler = null
    }
    this.resolvePromise = null
    this.downloadPromise = null
  }

  /**
   * 다운로드 응답이 캡처될 때까지 대기
   * @param timeout - 타임아웃 (ms, 기본값 30초)
   */
  async waitForDownload(timeout: number = 30000): Promise<DownloadCapture> {
    if (!this.downloadPromise) {
      throw new Error('startListening()을 먼저 호출하세요')
    }

    const timeoutPromise = new Promise<DownloadCapture>((_, reject) => {
      setTimeout(() => reject(new Error(`다운로드 응답 대기 타임아웃 (${timeout}ms)`)), timeout)
    })

    return Promise.race([this.downloadPromise, timeoutPromise])
  }

  /**
   * Mock PDF 다운로드 응답을 설정 (route interception 사용)
   * @param urlPattern - 인터셉트할 URL 패턴
   * @param filename - 다운로드 파일명
   */
  async mockPdfDownload(urlPattern: string, filename: string = 'report.pdf'): Promise<void> {
    // 최소한의 유효 PDF 바이트 (헤더 + 빈 문서)
    const pdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF',
      'utf-8'
    )

    await this.page.route(urlPattern, async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': pdfContent.length.toString(),
        },
        body: pdfContent,
      })
    })
  }

  /** 간단한 glob 매칭 (* → 임의 경로 세그먼트) */
  private globMatch(url: string, pattern: string): boolean {
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
    return new RegExp(regexStr).test(url)
  }
}
