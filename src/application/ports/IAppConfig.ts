/**
 * IAppConfig
 *
 * Application configuration interface.
 * Use cases inject this instead of reading process.env directly (QUAL-10).
 */

export interface IAppConfig {
  /** Node.js environment */
  nodeEnv: string

  /** Meta API App ID */
  metaAppId: string | undefined

  /** Meta API App Secret */
  metaAppSecret: string | undefined

  /** Public-facing app URL */
  appUrl: string
}
