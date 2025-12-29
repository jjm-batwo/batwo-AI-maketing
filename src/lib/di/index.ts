export { container, DI_TOKENS } from './container'
export type { DIToken } from './types'

// Re-export convenience functions
export {
  getCampaignRepository,
  getReportRepository,
  getKPIRepository,
  getQuotaService,
  getCreateCampaignUseCase,
  getGenerateWeeklyReportUseCase,
  getGetDashboardKPIUseCase,
} from './container'
