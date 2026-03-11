import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceBenchmarkService } from '@/application/services/PerformanceBenchmarkService';

describe('PerformanceBenchmarkService', () => {
  let service: PerformanceBenchmarkService;
  let mockKpiRepository: any;
  let mockCampaignRepository: any;

  beforeEach(() => {
    mockKpiRepository = {
      getIndustryPercentiles: vi.fn(),
    };
    mockCampaignRepository = {};

    service = new PerformanceBenchmarkService(mockKpiRepository, mockCampaignRepository);
    // Override the private method for testing if needed, or we can mock it
    service['getUserAverageMetrics'] = vi.fn().mockResolvedValue({
      roas: 3.5,
      ctr: 1.5,
      cpa: 12000,
    });
  });

  it('should calculate percentile position for user metrics', async () => {
    mockKpiRepository.getIndustryPercentiles.mockResolvedValue({
      roas: { p25: 1.5, p50: 2.5, p75: 4.0, p90: 6.0 },
      ctr: { p25: 0.5, p50: 1.2, p75: 2.0, p90: 3.0 },
      _sampleSize: 100,
    });

    service['getUserAverageMetrics'] = vi.fn().mockResolvedValue({
      roas: 3.5,
      ctr: 1.5,
    });

    const result = await service.getBenchmark('user-123', 'ECOMMERCE', 30);

    const roasMetric = result.metrics.find(m => m.metric === 'roas')!;
    expect(roasMetric.percentile).toBeGreaterThanOrEqual(0);
    expect(roasMetric.percentile).toBeLessThanOrEqual(100);
    expect(roasMetric.grade).toBeDefined();
    expect(roasMetric.recommendation).toBeTruthy();
    expect(result.sampleSize).toBe(100);
  });

  it('should handle CPA inversely (lower is better)', async () => {
    mockKpiRepository.getIndustryPercentiles.mockResolvedValue({
      cpa: { p25: 20000, p50: 15000, p75: 10000, p90: 5000 },
    });
    
    service['getUserAverageMetrics'] = vi.fn().mockResolvedValue({
      cpa: 8000,
    });

    const result = await service.getBenchmark('user-123', 'ECOMMERCE', 30);
    const cpaMetric = result.metrics.find(m => m.metric === 'cpa')!;
    expect(cpaMetric.percentile).toBeGreaterThan(75); // 8000 < 10000 (p75) → 상위
  });
});
