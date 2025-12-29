/**
 * Error Handling Module
 *
 * 에러 리포팅 및 처리 유틸리티 모음
 */

export {
  reportError,
  reportApiError,
  reportErrorWithFeedback,
  reportMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
} from './reportError'

export type { ErrorContext, ErrorSeverity } from './reportError'
