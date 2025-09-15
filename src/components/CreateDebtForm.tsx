import React, { useState } from 'react'
import { CreateDebtForm as CreateDebtFormData } from '@/types'

interface CreateDebtFormProps {
  onSubmit: (formData: CreateDebtFormData) => void
  isLoading: boolean
}

const CreateDebtForm: React.FC<CreateDebtFormProps> = ({ onSubmit, isLoading }) => {
  const [amount, setAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [termInDays, setTermInDays] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && interestRate && termInDays) {
      onSubmit({
        amount,
        interestRate,
        termDays: termInDays,
        isAnonymous
      })
    }
  }

  return (
    <div className="form-container">
      <h3>&gt; Create New Debt Record</h3>
      <form onSubmit={handleSubmit} className="debt-form">
        <div className="form-group">
          <label htmlFor="amount">&gt; Debt Amount (USD):</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (e.g., 10000)"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="interestRate">&gt; Interest Rate (%):</label>
          <input
            type="number"
            id="interestRate"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="Enter rate (e.g., 5.5)"
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="termInDays">&gt; Term (Days):</label>
          <input
            type="number"
            id="termInDays"
            value={termInDays}
            onChange={(e) => setTermInDays(e.target.value)}
            placeholder="Enter term in days (e.g., 365)"
            min="1"
            max="36500"
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            &gt; Keep debt record anonymous (recommended for privacy)
          </label>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading || !amount || !interestRate || !termInDays}
        >
          {isLoading ? 'Creating Debt Record...' : '🔒 Create Encrypted Debt Record'}
        </button>
      </form>
    </div>
  )
}

export default CreateDebtForm