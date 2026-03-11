'use client';

import { memo, useState } from 'react';
import { useCampaignStore } from '@/presentation/stores';
import { BulkAction } from '@/application/use-cases/campaign/BulkUpdateCampaignsUseCase';
import { BulkBudgetModal } from './BulkBudgetModal';

export const BulkActionBar = memo(function BulkActionBar() {
  const { selectedCampaignIds, clearSelection } = useCampaignStore();
  const [loading, setLoading] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  if (selectedCampaignIds.length === 0) return null;

  const executeBulkAction = async (action: BulkAction) => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignIds: selectedCampaignIds, action }),
      });
      const data = await res.json();
      if (data.data?.failedCount > 0) {
        alert(`${data.data.successCount}개 성공, ${data.data.failedCount}개 실패`);
      } else {
        alert('작업이 완료되었습니다.');
      }
      clearSelection();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border rounded-xl px-6 py-3 flex items-center gap-4 z-50">
        <span className="text-sm font-medium text-gray-700">
          {selectedCampaignIds.length}개 선택됨
        </span>
        <div className="h-6 w-px bg-gray-200" />
        <button onClick={() => executeBulkAction({ type: 'status_change', status: 'PAUSED' as any })}
          disabled={loading} className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200">
          일시정지
        </button>
        <button onClick={() => executeBulkAction({ type: 'status_change', status: 'ACTIVE' as any })}
          disabled={loading} className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
          활성화
        </button>
        <button onClick={() => setShowBudgetModal(true)}
          disabled={loading} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200">
          예산 변경
        </button>
        <button onClick={() => executeBulkAction({ type: 'delete' })}
          disabled={loading} className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200">
          삭제
        </button>
        <button onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700">
          선택 해제
        </button>
      </div>

      {showBudgetModal && (
        <BulkBudgetModal 
          onClose={() => setShowBudgetModal(false)}
          onConfirm={(mode, value) => {
            setShowBudgetModal(false);
            executeBulkAction({ type: 'budget_change', mode, value });
          }}
        />
      )}
    </>
  );
});
