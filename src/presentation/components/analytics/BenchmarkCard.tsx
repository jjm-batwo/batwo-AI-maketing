'use client';

import { memo } from 'react';
import type { IndustryBenchmarkData, MetricBenchmark } from '@/domain/value-objects/IndustryBenchmark';

const GRADE_CONFIG = {
  top10: { label: '상위 10%', color: 'text-green-700 bg-green-100' },
  top25: { label: '상위 25%', color: 'text-blue-700 bg-blue-100' },
  above_average: { label: '평균 이상', color: 'text-blue-600 bg-blue-50' },
  average: { label: '평균', color: 'text-gray-600 bg-gray-100' },
  below_average: { label: '평균 이하', color: 'text-orange-600 bg-orange-100' },
  bottom25: { label: '하위 25%', color: 'text-red-600 bg-red-100' },
};

const METRIC_LABELS: Record<string, string> = {
  roas: 'ROAS', ctr: 'CTR', cpa: 'CPA', cvr: '전환율', cpc: 'CPC', cpm: 'CPM',
};

function formatMetricValue(metric: string, value: number): string {
  if (metric === 'roas') return value.toFixed(2) + 'x';
  if (metric === 'ctr' || metric === 'cvr') return value.toFixed(2) + '%';
  return '₩' + Math.round(value).toLocaleString();
}

export const BenchmarkCard = memo(function BenchmarkCard({ data }: { data: IndustryBenchmarkData }) {
  const grade = GRADE_CONFIG[data.overallGrade] || GRADE_CONFIG.average;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">업종 벤치마크</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${grade.color}`}>
          {grade.label}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {data.industry} 업종 {data.sampleSize}개 계정 대비 | 최근 {data.periodDays}일
      </p>

      <div className="space-y-4">
        {data.metrics.map((metric) => (
          <MetricRow key={metric.metric} metric={metric} />
        ))}
      </div>
    </div>
  );
});

function MetricRow({ metric }: { metric: MetricBenchmark }) {
  const grade = GRADE_CONFIG[metric.grade] || GRADE_CONFIG.average;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{METRIC_LABELS[metric.metric] || metric.metric.toUpperCase()}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${grade.color}`}>
          상위 {100 - Math.round(metric.percentile)}%
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, metric.percentile))}%` }}
        />
        {/* 업종 평균 마커 */}
        <div className="absolute h-4 w-0.5 bg-gray-400 -top-1" style={{ left: '50%' }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>내 값: {formatMetricValue(metric.metric, metric.userValue)}</span>
        <span>평균: {formatMetricValue(metric.metric, metric.industryAverage)}</span>
      </div>
      {metric.recommendation && (
        <p className="text-xs text-gray-500 mt-1">{metric.recommendation}</p>
      )}
    </div>
  );
}
