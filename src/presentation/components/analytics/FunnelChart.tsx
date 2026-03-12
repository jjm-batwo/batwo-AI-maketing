'use client';

import { memo } from 'react';
import type { FunnelData, FunnelStageData } from '@/domain/value-objects/FunnelStage';

const STAGE_LABELS: Record<string, string> = {
  PageView: '페이지 조회',
  ViewContent: '콘텐츠 조회',
  AddToCart: '장바구니 추가',
  InitiateCheckout: '결제 시작',
  Purchase: '구매 완료',
};

const STAGE_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#22C55E'];

export const FunnelChart = memo(function FunnelChart({ data }: { data: FunnelData }) {
  const maxCount = Math.max(...data.stages.map(s => s.count), 1);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">전환 퍼널</h3>
        <span className="text-sm text-muted-foreground">
          전체 전환율: <strong>{data.overallConversionRate}%</strong>
        </span>
      </div>

      <div className="space-y-3">
        {data.stages.map((stage, i) => (
          <FunnelStageBar
            key={stage.stage}
            stage={stage}
            label={STAGE_LABELS[stage.stage] || stage.stage}
            color={STAGE_COLORS[i] || '#cbd5e1'}
            widthPercent={(stage.count / maxCount) * 100}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  );
});

function FunnelStageBar({ stage, label, color, widthPercent, isFirst }: {
  stage: FunnelStageData;
  label: string;
  color: string;
  widthPercent: number;
  isFirst: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-sm text-muted-foreground text-right">{label}</div>
      <div className="flex-1">
        <div
          className="h-10 rounded-md flex items-center px-3 text-white text-sm font-medium transition-all"
          style={{ width: `${Math.max(widthPercent, 5)}%`, backgroundColor: color }}
        >
          {stage.count.toLocaleString()}
        </div>
      </div>
      <div className="w-20 text-right">
        {!isFirst && (
          <span className={`text-sm font-medium ${stage.dropOffRate > 70 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
            {stage.conversionRate}%
          </span>
        )}
      </div>
    </div>
  );
}
