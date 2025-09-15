import React from 'react'
import { DebtRecord, RestructuringProposal, DebtStatus, ProposalStatus } from '@/types'

interface ViewDebtsProps {
  debts: DebtRecord[]
  proposals: RestructuringProposal[]
  onMarkResolved: (debtId: number) => void
  isLoading: boolean
}

const ViewDebts: React.FC<ViewDebtsProps> = ({ debts, proposals, onMarkResolved, isLoading }) => {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatRate = (basisPoints: number) => {
    return `${(basisPoints / 100).toFixed(2)}%`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="view-container">
      <h3>&gt; Your Debt Records ({debts.length})</h3>
      
      {debts.length === 0 ? (
        <div className="empty-state">
          <p>&gt; No debt records found. Create your first debt record to get started!</p>
        </div>
      ) : (
        <div className="debts-list">
          {debts.map((debt) => (
            <div key={debt.id} className="debt-item">
              <div className="debt-header">
                <span className="debt-id">Debt ID: {debt.id}</span>
                <span className={`debt-status ${DebtStatus[debt.status].toLowerCase()}`}>
                  {DebtStatus[debt.status]}
                </span>
              </div>
              
              <div className="debt-details">
                <div className="detail-row">
                  <span>Amount:</span>
                  <span className="highlight">{formatCurrency(debt.amount)}</span>
                </div>
                <div className="detail-row">
                  <span>Interest Rate:</span>
                  <span>{formatRate(debt.interestRate)}</span>
                </div>
                <div className="detail-row">
                  <span>Term:</span>
                  <span>{debt.originalTerm} days</span>
                </div>
                <div className="detail-row">
                  <span>Remaining:</span>
                  <span>{debt.remainingTerm} days</span>
                </div>
                <div className="detail-row">
                  <span>Created:</span>
                  <span>{formatDate(debt.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span>Privacy:</span>
                  <span>{debt.isAnonymous ? '🔒 Anonymous' : '🔓 Public'}</span>
                </div>
              </div>

              {debt.status === DebtStatus.ACTIVE && (
                <button 
                  className="resolve-button"
                  onClick={() => onMarkResolved(debt.id)}
                  disabled={isLoading}
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {proposals.length > 0 && (
        <div className="proposals-section">
          <h3>&gt; Active Proposals ({proposals.length})</h3>
          <div className="proposals-list">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="proposal-item">
                <div className="proposal-header">
                  <span>Proposal ID: {proposal.id}</span>
                  <span className={`proposal-status ${ProposalStatus[proposal.status].toLowerCase()}`}>
                    {ProposalStatus[proposal.status]}
                  </span>
                </div>
                <div className="proposal-details">
                  <p>Debt ID: {proposal.debtId}</p>
                  <p>New Amount: {formatCurrency(proposal.newAmount)}</p>
                  <p>New Rate: {formatRate(proposal.newRate)}</p>
                  <p>New Term: {proposal.newTerm} days</p>
                  <p>Reason: {proposal.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewDebts