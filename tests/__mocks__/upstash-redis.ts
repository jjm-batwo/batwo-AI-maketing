// Mock for @upstash/redis
export class Redis {
   
  constructor(..._args: unknown[]) {}

   
  async get(_key: string) {
    return null
  }

   
  async set(_key: string, _value: unknown, _options?: unknown) {
    return 'OK'
  }

   
  async del(_key: string) {
    return 1
  }

   
  async incr(_key: string) {
    return 1
  }

   
  async expire(_key: string, _seconds: number) {
    return 1
  }
}

export function fromEnv() {
  return new Redis()
}
