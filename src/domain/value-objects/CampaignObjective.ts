export enum CampaignObjective {
  AWARENESS = 'AWARENESS',
  TRAFFIC = 'TRAFFIC',
  ENGAGEMENT = 'ENGAGEMENT',
  LEADS = 'LEADS',
  APP_PROMOTION = 'APP_PROMOTION',
  SALES = 'SALES',
  CONVERSIONS = 'CONVERSIONS',
}

export const CAMPAIGN_OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  [CampaignObjective.AWARENESS]: '브랜드 인지도',
  [CampaignObjective.TRAFFIC]: '트래픽',
  [CampaignObjective.ENGAGEMENT]: '참여',
  [CampaignObjective.LEADS]: '리드',
  [CampaignObjective.APP_PROMOTION]: '앱 홍보',
  [CampaignObjective.SALES]: '판매',
  [CampaignObjective.CONVERSIONS]: '전환',
}

export const CAMPAIGN_OBJECTIVE_DESCRIPTIONS: Record<CampaignObjective, string> = {
  [CampaignObjective.AWARENESS]: '더 많은 사람들에게 브랜드를 알리세요',
  [CampaignObjective.TRAFFIC]: '웹사이트나 앱으로 트래픽을 유도하세요',
  [CampaignObjective.ENGAGEMENT]: '게시물 참여와 페이지 좋아요를 늘리세요',
  [CampaignObjective.LEADS]: '잠재 고객의 연락처를 수집하세요',
  [CampaignObjective.APP_PROMOTION]: '앱 설치와 사용을 늘리세요',
  [CampaignObjective.SALES]: '상품 판매를 늘리세요',
  [CampaignObjective.CONVERSIONS]: '특정 행동을 유도하세요',
}
