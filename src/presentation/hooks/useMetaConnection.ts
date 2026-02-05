import { useQuery } from '@tanstack/react-query'

interface MetaAccount {
  id: string
  metaAccountId: string
  businessName: string | null
  createdAt: string
  tokenExpiry: string | null
}

interface MetaConnectionState {
  isConnected: boolean
  isLoading: boolean
  accounts: MetaAccount[]
  error: Error | null
  refetch: () => void
}

export function useMetaConnection(): MetaConnectionState {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['metaAccounts'],
    queryFn: async () => {
      const response = await fetch('/api/meta/accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch Meta connection status')
      }
      return response.json() as Promise<{ accounts: MetaAccount[] }>
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })

  return {
    isConnected: (data?.accounts?.length ?? 0) > 0,
    isLoading,
    accounts: data?.accounts ?? [],
    error: error as Error | null,
    refetch,
  }
}
