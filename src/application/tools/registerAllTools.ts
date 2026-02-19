import { ToolRegistry } from './index'
// Query tools
import { createGetPerformanceKPITool } from './queries/getPerformanceKPI.tool'
import { createListCampaignsTool } from './queries/listCampaigns.tool'
import { createGetCampaignDetailTool } from './queries/getCampaignDetail.tool'
import { createGenerateReportTool } from './queries/generateReport.tool'
import { createCheckAnomaliesTool } from './queries/checkAnomalies.tool'
import { createAnalyzeTrendsTool } from './queries/analyzeTrends.tool'
import { createGetBudgetRecommendationTool } from './queries/getBudgetRecommendation.tool'
// Mutation tools
import { createCreateCampaignTool } from './mutations/createCampaign.tool'
import { createUpdateCampaignBudgetTool } from './mutations/updateCampaignBudget.tool'
import { createPauseCampaignTool } from './mutations/pauseCampaign.tool'
import { createResumeCampaignTool } from './mutations/resumeCampaign.tool'
import { createDeleteCampaignTool } from './mutations/deleteCampaign.tool'
import { createGenerateAdCopyTool } from './mutations/generateAdCopy.tool'
// Meta tools
import { createAskClarificationTool } from './meta/askClarification.tool'
import { createFreeformResponseTool } from './meta/freeformResponse.tool'
import { createAskGuideQuestionTool } from './meta/askGuideQuestion.tool'
import { createRecommendCampaignSettingsTool } from './meta/recommendCampaignSettings.tool'
// Types
import type { IToolRegistry } from '@application/ports/IConversationalAgent'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import type { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import type { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import type { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import type { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import type { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import type { PauseCampaignUseCase } from '@application/use-cases/campaign/PauseCampaignUseCase'
import type { ResumeCampaignUseCase } from '@application/use-cases/campaign/ResumeCampaignUseCase'
import type { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'

export interface RegisterAllToolsDeps {
  // Repositories
  campaignRepository: ICampaignRepository
  kpiRepository: IKPIRepository
  // Use cases
  getDashboardKPIUseCase: GetDashboardKPIUseCase
  listCampaignsUseCase: ListCampaignsUseCase
  getCampaignUseCase: GetCampaignUseCase
  generateWeeklyReportUseCase: GenerateWeeklyReportUseCase
  createCampaignUseCase: CreateCampaignUseCase
  updateCampaignUseCase: UpdateCampaignUseCase
  pauseCampaignUseCase: PauseCampaignUseCase
  resumeCampaignUseCase: ResumeCampaignUseCase
  deleteCampaignUseCase: DeleteCampaignUseCase
}

export function registerAllTools(deps: RegisterAllToolsDeps): IToolRegistry {
  const registry = new ToolRegistry()

  // Query tools (7)
  registry.register(createGetPerformanceKPITool(deps.getDashboardKPIUseCase))
  registry.register(createListCampaignsTool(deps.listCampaignsUseCase))
  registry.register(createGetCampaignDetailTool(deps.getCampaignUseCase))
  registry.register(createGenerateReportTool(deps.generateWeeklyReportUseCase))
  registry.register(createCheckAnomaliesTool(deps.campaignRepository, deps.kpiRepository))
  registry.register(createAnalyzeTrendsTool(deps.campaignRepository, deps.kpiRepository))
  registry.register(createGetBudgetRecommendationTool(deps.campaignRepository, deps.kpiRepository))

  // Mutation tools (6)
  registry.register(createCreateCampaignTool(deps.createCampaignUseCase))
  registry.register(createUpdateCampaignBudgetTool(deps.updateCampaignUseCase, deps.campaignRepository))
  registry.register(createPauseCampaignTool(deps.pauseCampaignUseCase, deps.campaignRepository))
  registry.register(createResumeCampaignTool(deps.resumeCampaignUseCase, deps.campaignRepository))
  registry.register(createDeleteCampaignTool(deps.deleteCampaignUseCase, deps.campaignRepository))
  registry.register(createGenerateAdCopyTool())

  // Meta tools (4)
  registry.register(createAskClarificationTool())
  registry.register(createFreeformResponseTool())
  registry.register(createAskGuideQuestionTool())
  registry.register(createRecommendCampaignSettingsTool())

  return registry
}
