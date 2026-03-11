import { IndustryBenchmarkData, MetricBenchmark, BenchmarkMetric, calculatePercentileGrade } from '@/domain/value-objects/IndustryBenchmark';
import { IKPIRepository } from '@/domain/repositories/IKPIRepository';
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository';

export class PerformanceBenchmarkService {
  private readonly INVERSE_METRICS: BenchmarkMetric[] = ['cpa', 'cpc', 'cpm'];

  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository,
  ) {}

  async getBenchmark(userId: string, industry: string, periodDays: number): Promise<IndustryBenchmarkData> {
    const userMetrics = await this.getUserAverageMetrics(userId, periodDays);
    const percentiles = await this.kpiRepository.getIndustryPercentiles(industry, periodDays);

    const metrics: MetricBenchmark[] = Object.entries(userMetrics).map(([metric, value]) => {
      const p = percentiles[metric as BenchmarkMetric];
      if (!p) return null;

      const isInverse = this.INVERSE_METRICS.includes(metric as BenchmarkMetric);
      const percentile = this.interpolatePercentile(value, p, isInverse);
      const grade = calculatePercentileGrade(percentile);

      return {
        metric: metric as BenchmarkMetric,
        userValue: value,
        industryAverage: p.p50,
        percentile,
        grade,
        gap: value - p.p50,
        recommendation: this.generateRecommendation(metric as BenchmarkMetric, grade, value, p.p50),
      };
    }).filter(Boolean) as MetricBenchmark[];

    const overallPercentile = metrics.length > 0 
      ? Math.round(metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length)
      : 0;

    return {
      industry,
      metrics,
      overallPercentile,
      overallGrade: calculatePercentileGrade(overallPercentile),
      sampleSize: percentiles._sampleSize ?? 0,
      periodDays,
    };
  }

  private interpolatePercentile(
    value: number,
    p: { p25: number; p50: number; p75: number; p90: number },
    isInverse: boolean,
  ): number {
    const v = isInverse ? -value : value;
    const thresholds = isInverse
      ? { p25: -p.p25, p50: -p.p50, p75: -p.p75, p90: -p.p90 }
      : p;

    if (v >= thresholds.p90) return 95;
    if (v >= thresholds.p75) return 75 + 15 * (v - thresholds.p75) / (thresholds.p90 - thresholds.p75);
    if (v >= thresholds.p50) return 50 + 25 * (v - thresholds.p50) / (thresholds.p75 - thresholds.p50);
    if (v >= thresholds.p25) return 25 + 25 * (v - thresholds.p25) / (thresholds.p50 - thresholds.p25);
    return Math.max(5, 25 * v / thresholds.p25);
  }

  private generateRecommendation(metric: BenchmarkMetric, grade: string, userValue: number, avgValue: number): string {
    if (grade === 'top10' || grade === 'top25') {
      return `훌륭합니다! ${metric.toUpperCase()} 성과가 업종 평균 대비 뛰어납니다.`;
    }
    if (grade === 'above_average') {
      return `좋습니다. ${metric.toUpperCase()} 성과가 안정적입니다.`;
    }
    return `개선이 필요합니다. 평균(${avgValue.toFixed(2)})을 목표로 타겟팅과 예산을 조정해보세요.`;
  }

  private async getUserAverageMetrics(userId: string, periodDays: number): Promise<Record<string, number>> {
    // 실제 구현은 kpiRepository 등을 통해 가져오도록 합니다.
    return {
      roas: 3.5,
      ctr: 1.5,
      cpa: 12000,
    };
  }
}
