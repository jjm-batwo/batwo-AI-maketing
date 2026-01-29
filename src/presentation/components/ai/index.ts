export { ScienceScore } from './ScienceScore'
export { CitationCard, CitationList } from './CitationCard'
export { DomainBreakdown } from './DomainBreakdown'
export { EvidenceBadge, RecommendationCard } from './EvidenceBadge'

// Progressive Loading Components
export { StreamingText } from './StreamingText'
export { AILoadingIndicator } from './AILoadingIndicator'
export { StreamingProgress } from './StreamingProgress'
export { SkeletonAI } from './SkeletonAI'

// Confidence System Components
export { ConfidenceIndicator } from './ConfidenceIndicator'
export { ConfidenceHighlight } from './ConfidenceHighlight'
export type { SentenceConfidence } from './ConfidenceHighlight'
export { EvidencePanel } from './EvidencePanel'
export type { Evidence } from './EvidencePanel'

// Error Recovery Components
export { PartialSuccessUI } from './PartialSuccessUI'
export type { PartialResult, PartialSuccessUIProps } from './PartialSuccessUI'
export { ErrorRecoveryDisplay } from './ErrorRecoveryDisplay'
export type { RecoveryOption, ErrorRecoveryDisplayProps } from './ErrorRecoveryDisplay'

// Ambient AI Components
export { AmbientInsightToast } from './AmbientInsightToast'

// Contextual AI Suggestion Components
export {
  AISuggestionBubble,
  CompactAISuggestion,
  TooltipAISuggestion,
  useSuggestionState
} from './AISuggestionBubble'
export type {
  AISuggestionBubbleProps,
  CompactAISuggestionProps,
  TooltipAISuggestionProps,
  UseSuggestionStateProps
} from './AISuggestionBubble'

export {
  ContextualAIProvider,
  useContextTracking,
  useSuggestionTiming,
  useManualSuggestion
} from './ContextualAIProvider'
export type {
  ContextualAIProviderProps,
  SuggestionMapping
} from './ContextualAIProvider'

// Feature Discovery & Onboarding Components
export { AIFeatureTour } from './AIFeatureTour'
export type { AIFeatureTourProps, TourStep } from './AIFeatureTour'
export { FirstUseGuide } from './FirstUseGuide'
export type { FirstUseGuideProps } from './FirstUseGuide'
export { FeatureDiscoveryHint } from './FeatureDiscoveryHint'
export type { FeatureDiscoveryHintProps } from './FeatureDiscoveryHint'
