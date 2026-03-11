import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversionFunnelService } from '@/application/services/ConversionFunnelService';
import type { IConversionEventRepository } from '@domain/repositories/IConversionEventRepository';

describe('ConversionFunnelService', () => {
  let mockRepository: any;
  let service: ConversionFunnelService;

  beforeEach(() => {
    mockRepository = {
      countByEventName: vi.fn(),
    };
    service = new ConversionFunnelService(mockRepository);
  });

  const setMockCounts = (counts: Record<string, number>) => {
    mockRepository.countByEventName.mockImplementation(async (_pixelId: string, eventName: string, _since: Date) => {
      return { count: counts[eventName] || 0, value: 0 };
    });
  };

  it('should calculate funnel stages with conversion rates', async () => {
    setMockCounts({
      'PageView': 10000,
      'ViewContent': 3000,
      'AddToCart': 1000,
      'InitiateCheckout': 500,
      'Purchase': 200,
    });

    const funnel = await service.getFunnel('pixel-1', '30d');

    expect(funnel.stages).toHaveLength(5);
    expect(funnel.stages[0].conversionRate).toBe(100);
    expect(funnel.stages[1].conversionRate).toBe(30); // 3000/10000
    expect(funnel.stages[4].conversionRate).toBe(40); // 200/500
    expect(funnel.overallConversionRate).toBe(2);     // 200/10000
  });

  it('should handle zero events gracefully', async () => {
    setMockCounts({});

    const funnel = await service.getFunnel('pixel-1', '30d');
    expect(funnel.stages.every((s: any) => s.count === 0)).toBe(true);
    expect(funnel.overallConversionRate).toBe(0);
  });
});
