import { IPromptTemplateService, TemplateName } from '../ports/IPromptTemplateService'

/**
 * PromptTemplateService
 * - Centralizes single-source prompt templates with interpolation support.
 * - Supports {{variable}} interpolation via context object.
 * - Migrates built-in templates from ConversationalAgentService.
 */
export class PromptTemplateService implements IPromptTemplateService {
  private templates: Record<TemplateName, string> = {
    [TemplateName.SystemDefault]:
      'System: You are a helpful assistant. User: {{userName}}. UI context: {{uiContext}}. Tools: {{toolDescriptions}}',
    [TemplateName.ConversationalAgent]: 'Conversational Agent System: {{systemPrompt}}',
    [TemplateName.OpenAIInstruction]: 'OpenAI Instruction: {{instruction}}',
  }

  // Migration: pre-baked templates migrated from ConversationalAgentService
  private static migratedTemplates: Partial<Record<TemplateName, string>> = {
    [TemplateName.SystemDefault]:
      'System (migrated): You are a helpful assistant. User: {{userName}}. Context: {{uiContext}}',
  }

  constructor() {
    // Apply migrated templates if present
    this.templates = {
      ...this.templates,
      ...(PromptTemplateService.migratedTemplates as Record<TemplateName, string>),
    }
  }

  getPrompt(templateName: TemplateName, context?: Record<string, unknown>): string {
    const tmpl = this.templates[templateName]
    if (!tmpl) return ''
    if (!context) return tmpl
    return this.interpolate(tmpl, context)
  }

  private interpolate(template: string, context?: Record<string, unknown>): string {
    if (!context) return template
    return template.replace(/{{\s*([\w.]+)\s*}}/g, (_m, key) => {
      // support nested keys like user.name via dot notation
      const parts = key.split('.')
      let value: unknown = context
      for (const part of parts) {
        if (value == null) {
          value = ''
          break
        }
        value = (value as Record<string, unknown>)[part]
      }
      return value != null ? String(value) : ''
    })
  }
}
