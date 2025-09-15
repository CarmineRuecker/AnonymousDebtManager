import React from 'react'

interface TabNavigationProps {
  activeTab: 'create' | 'view' | 'propose'
  onTabChange: (tab: 'create' | 'view' | 'propose') => void
  debtCount: number
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, debtCount }) => {
  const tabs = [
    { id: 'create', label: 'Create Debt', icon: '📝' },
    { id: 'view', label: `View Debts (${debtCount})`, icon: '📋' },
    { id: 'propose', label: 'Propose Restructuring', icon: '🔄' }
  ] as const

  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabNavigation