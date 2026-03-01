export interface MetaAdAccountTokenRecord {
  id: string
  userId: string
  metaAccountId: string
  accessToken: string
  tokenExpiry: Date | null
}

export interface IMetaAdAccountRepository {
  findByUserId(userId: string): Promise<MetaAdAccountTokenRecord | null>
  findExpiringBefore(thresholdDate: Date): Promise<MetaAdAccountTokenRecord[]>
  updateToken(accountId: string, encryptedToken: string, tokenExpiry: Date): Promise<void>
}
