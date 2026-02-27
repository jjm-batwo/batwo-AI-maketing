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

  // GETDEL: 값을 반환하고 즉시 삭제 (원자적)
  async getdel(_key: string) {
    return null
  }


  async incr(_key: string) {
    return 1
  }


  async expire(_key: string, _seconds: number) {
    return 1
  }

  // DB 전체 키 수 반환
  async dbsize() {
    return 0
  }

  // DB 전체 초기화 (테스트용)
  async flushdb() {
    return 'OK'
  }
}

export function fromEnv() {
  return new Redis()
}
