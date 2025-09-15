import React from 'react'

interface DebtPresetsProps {
  onTabChange: (tab: 'create' | 'view' | 'propose') => void
}

const DebtPresets: React.FC<DebtPresetsProps> = ({ onTabChange }) => {
  const presets = [
    {
      title: 'Personal Loan',
      description: 'Standard personal loan restructuring',
      action: () => onTabChange('create')
    },
    {
      title: 'Credit Card Debt',
      description: 'Credit card balance consolidation',
      action: () => onTabChange('create')
    },
    {
      title: 'View My Debts',
      description: 'Check existing debt records',
      action: () => onTabChange('view')
    },
    {
      title: 'Propose Changes',
      description: 'Submit restructuring proposal',
      action: () => onTabChange('propose')
    }
  ]

  return (
    <div className="debt-presets">
      <h3>&gt; Quick Actions</h3>
      <div className="preset-buttons">
        {presets.map((preset, index) => (
          <button
            key={index}
            className="preset-button"
            onClick={preset.action}
            title={preset.description}
          >
            {preset.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DebtPresets