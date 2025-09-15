import React, { useState } from 'react'
import { DebtRecord, ProposeRestructuringForm as ProposeRestructuringFormData } from '@/types'

interface ProposeRestructuringFormProps {
  debts: DebtRecord[]
  onSubmit: (formData: ProposeRestructuringFormData) => void
  isLoading: boolean
}

const ProposeRestructuringForm: React.FC<ProposeRestructuringFormProps> = ({ 
  debts, 
  onSubmit, 
  isLoading 
}) => {
  const [selectedDebtId, setSelectedDebtId] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newRate, setNewRate] = useState('')
  const [newTerm, setNewTerm] = useState('')
  const [reason, setReason] = useState('')

  const activeDebts = debts.filter(debt => debt.status === 0) // ACTIVE status
  const selectedDebt = activeDebts.find(debt => debt.id === parseInt(selectedDebtId))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDebtId && newAmount && newRate && newTerm && reason) {
      onSubmit({
        selectedDebtId,
        newAmount,
        newRate,
        newTerm,
        reason
      })
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatRate = (basisPoints: number) => {
    return `${(basisPoints / 100).toFixed(2)}%`
  }

  return (
    <div className="form-container">
      <h3>&gt; Propose Debt Restructuring</h3>
      
      {activeDebts.length === 0 ? (
        <div className="empty-state">
          <p>&gt; No active debts available for restructuring. Create a debt record first!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="restructuring-form">
          <div className="form-group">
            <label htmlFor="debtId">&gt; Select Debt to Restructure:</label>
            <select
              id="debtId"
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              required
            >
              <option value="">Choose a debt record...</option>
              {activeDebts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  Debt #{debt.id} - {formatCurrency(debt.amount)} at {formatRate(debt.interestRate)}
                </option>
              ))}
            </select>
          </div>

          {selectedDebt && (
            <div className="current-terms">
              <h4>&gt; Current Terms:</h4>
              <div className="terms-display">
                <p>Amount: {formatCurrency(selectedDebt.amount)}</p>
                <p>Interest Rate: {formatRate(selectedDebt.interestRate)}</p>
                <p>Remaining Term: {selectedDebt.remainingTerm} days</p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newAmount">&gt; New Amount (USD):</label>
            <input
              type="number"
              id="newAmount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Enter new amount"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newRate">&gt; New Interest Rate (%):</label>
            <input
              type="number"
              id="newRate"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="Enter new rate"
              min="0"
              max="100"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newTerm">&gt; New Term (Days):</label>
            <input
              type="number"
              id="newTerm"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Enter new term in days"
              min="1"
              max="36500"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">&gt; Reason for Restructuring:</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to restructure this debt..."
              rows={4}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || !selectedDebtId || !newAmount || !newRate || !newTerm || !reason}
          >
            {isLoading ? 'Submitting Proposal...' : '📋 Submit Restructuring Proposal'}
          </button>
        </form>
      )}
    </div>
  )
}

export default ProposeRestructuringForm