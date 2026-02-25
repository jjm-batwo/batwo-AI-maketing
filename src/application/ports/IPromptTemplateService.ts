export enum TemplateName {
  SystemDefault = 'SystemDefault',
  ConversationalAgent = 'ConversationalAgent',
  OpenAIInstruction = 'OpenAIInstruction',
}

export interface IPromptTemplateService {
  getPrompt(templateName: TemplateName, context?: Record<string, unknown>): string
}

// Re-export alias for convenience in imports
export type { TemplateName as PromptTemplateName }
