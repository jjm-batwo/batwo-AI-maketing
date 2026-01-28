import { memo, useCallback } from 'react'
import type { DashboardTab } from './dashboardData'
import { TAB_CONFIG } from './dashboardData'

interface TabSwitcherProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}

export const TabSwitcher = memo(function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex p-1.5 bg-muted/50 border-b border-border/50 gap-1 relative z-10" role="tablist" aria-label="대시보드 탭">
      {TAB_CONFIG.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={onTabChange}
        />
      ))}
    </div>
  )
})

interface TabButtonProps {
  tab: typeof TAB_CONFIG[number]
  isActive: boolean
  onClick: (tab: DashboardTab) => void
}

const TabButton = memo(function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  const handleClick = useCallback(() => {
    onClick(tab.id)
  }, [onClick, tab.id])

  return (
    <button
      type="button"
      role="tab"
      onClick={handleClick}
      onMouseEnter={handleClick}
      onFocus={handleClick}
      aria-label={`${tab.label} 탭으로 전환`}
      aria-selected={isActive}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200 relative z-20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isActive
          ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
          : 'text-muted-foreground hover:bg-background/50'
      }`}
    >
      <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="sr-only sm:hidden">{tab.label}</span>
    </button>
  )
})
