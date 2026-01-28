// Mock for @upstash/ratelimit
export class Ratelimit {
   
  constructor(..._args: unknown[]) {}

   
  async limit(_identifier: string) {
    return {
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    }
  }
}

 
export const sliding = (..._args: unknown[]) => ({})
 
export const fixedWindow = (..._args: unknown[]) => ({})
