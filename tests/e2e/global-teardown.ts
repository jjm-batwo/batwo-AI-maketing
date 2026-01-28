import { FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Playwright Global Teardown
 *
 * 모든 테스트 완료 후 실행되는 정리 작업
 */
async function globalTeardown(_config: FullConfig) {
  console.log('[E2E Teardown] Starting global teardown...')

  // 저장된 스토리지 상태 파일 삭제
  const storageStatePath = path.join(__dirname, 'storage-state.json')

  try {
    if (fs.existsSync(storageStatePath)) {
      fs.unlinkSync(storageStatePath)
      console.log('[E2E Teardown] Storage state file removed')
    }
  } catch (error) {
    console.error('[E2E Teardown] Error removing storage state:', error)
  }

  console.log('[E2E Teardown] Global teardown completed')
}

export default globalTeardown
