/**
 * 감사(Audit) 캐시 포트 인터페이스
 *
 * 모든 캐시 어댑터(인메모리, Redis 등)가 구현해야 할 계약.
 * 제네릭 타입 T로 다양한 감사 데이터 형태를 수용한다.
 */
export interface IAuditCache<T> {
  /**
   * 값을 저장한다.
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttlMs TTL (밀리초 단위)
   */
  set(key: string, value: T, ttlMs: number): Promise<void>

  /**
   * 값을 조회한다. 존재하지 않거나 만료된 경우 null 반환.
   * @param key 캐시 키
   */
  get(key: string): Promise<T | null>

  /**
   * 값을 원자적으로 조회하고 즉시 삭제한다 (1회용 토큰 패턴).
   * 조회와 삭제 사이에 다른 요청이 개입할 수 없다.
   * @param key 캐시 키
   */
  getAndDelete(key: string): Promise<T | null>

  /**
   * 값을 삭제한다.
   * @param key 캐시 키
   */
  delete(key: string): Promise<void>

  /**
   * 현재 저장된 항목 수를 반환한다.
   */
  size(): Promise<number>

  /**
   * 모든 항목을 삭제한다 (주로 테스트용).
   */
  clearAll(): Promise<void>
}
