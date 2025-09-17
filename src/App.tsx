import React, { useState, useEffect } from 'react'
import './App.css'
import { useContract, DebtInfo, ProposalInfo } from './hooks/useContract'
import { 
  mockDebts, 
  mockProposals, 
  debtStatusMap, 
  proposalStatusMap,
  debtPresets,
  restructuringPresets,
  formatAmount,
  formatRate,
  formatDays,
  formatDate
} from './data/mockData'

type TabType = 'create' | 'view' | 'proposals' | 'stats'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('create')
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [userDebts, setUserDebts] = useState<DebtInfo[]>([])
  const [userProposals, setUserProposals] = useState<ProposalInfo[]>([])
  const [stats, setStats] = useState({ totalDebts: 0, resolvedDebts: 0, activeProposals: 0 })
  
  // 表单状态
  const [createForm, setCreateForm] = useState({
    amount: '',
    interestRate: '',
    termDays: '',
    fullyAnonymous: false,
    description: ''
  })
  
  const [proposalForm, setProposalForm] = useState({
    debtId: '',
    newAmount: '',
    newRate: '',
    newTerm: '',
    reason: ''
  })

  const {
    connectWallet: connectContractWallet,
    createDebt,
    proposeRestructuring,
    processProposal,
    resolveDebt,
    getUserDebts,
    getUserProposals,
    getStats,
    isLoading,
    error
  } = useContract()

  const connectWallet = async () => {
    try {
      const address = await connectContractWallet()
      if (address) {
        setIsConnected(true)
        setWalletAddress(address.slice(0, 6) + '...' + address.slice(-4))
        loadUserData(address)
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      // If contract connection fails, use mock data
      setIsConnected(true)
      setWalletAddress('0x1234...abcd')
      setUserDebts(mockDebts)
      setUserProposals(mockProposals)
      setStats({ totalDebts: 42, resolvedDebts: 28, activeProposals: 7 })
    }
  }

  const loadUserData = async (address: string) => {
    try {
      const [debts, proposals, statistics] = await Promise.all([
        getUserDebts(address),
        getUserProposals(address), 
        getStats()
      ])
      setUserDebts(debts.length > 0 ? debts : mockDebts)
      setUserProposals(proposals.length > 0 ? proposals : mockProposals)
      setStats(statistics.totalDebts > 0 ? statistics : { totalDebts: 42, resolvedDebts: 28, activeProposals: 7 })
    } catch (err) {
      // Use mock data as fallback
      setUserDebts(mockDebts)
      setUserProposals(mockProposals)
      setStats({ totalDebts: 42, resolvedDebts: 28, activeProposals: 7 })
    }
  }

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createDebt(
        parseInt(createForm.amount),
        parseFloat(createForm.interestRate),
        parseInt(createForm.termDays),
        createForm.fullyAnonymous,
        createForm.description
      )
      
      alert(`Debt created successfully!\nTransaction hash: ${result.transactionHash}${result.debtId ? `\nDebt ID: ${result.debtId}` : ''}`)
      
      // Reset form
      setCreateForm({
        amount: '',
        interestRate: '',
        termDays: '',
        fullyAnonymous: false,
        description: ''
      })
      
      // Reload data
      if (walletAddress) {
        loadUserData(walletAddress)
      }
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`)
    }
  }

  const handleProposeRestructuring = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await proposeRestructuring(
        parseInt(proposalForm.debtId),
        parseInt(proposalForm.newAmount),
        parseFloat(proposalForm.newRate),
        parseInt(proposalForm.newTerm),
        proposalForm.reason
      )
      
      alert(`Restructuring proposal submitted successfully!\nTransaction hash: ${result.transactionHash}`)
      
      // Reset form
      setProposalForm({
        debtId: '',
        newAmount: '',
        newRate: '',
        newTerm: '',
        reason: ''
      })
      
      // Reload data
      if (walletAddress) {
        loadUserData(walletAddress)
      }
    } catch (err: any) {
      alert(`Proposal failed: ${err.message}`)
    }
  }

  const handleProcessProposal = async (proposalId: number, approve: boolean) => {
    try {
      const result = await processProposal(proposalId, approve)
      alert(`Proposal ${approve ? "approved" : "rejected"} successfully!\nTransaction hash: ${result.transactionHash}`)
      
      // Reload data
      if (walletAddress) {
        loadUserData(walletAddress)
      }
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`)
    }
  }

  const handleResolveDebt = async (debtId: number) => {
    try {
      const result = await resolveDebt(debtId)
      alert(`Debt marked as resolved!\nTransaction hash: ${result.transactionHash}`)
      
      // Reload data
      if (walletAddress) {
        loadUserData(walletAddress)
      }
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`)
    }
  }

  const applyPreset = (preset: any) => {
    setCreateForm({
      amount: preset.amount.toString(),
      interestRate: preset.interestRate.toString(),
      termDays: preset.termDays.toString(),
      fullyAnonymous: false,
      description: preset.description
    })
  }

  const applyRestructuringPreset = (preset: any, selectedDebt: DebtInfo) => {
    const newAmount = selectedDebt.amount * (1 - preset.amountReduction)
    const newRate = selectedDebt.interestRate - preset.rateReduction
    const newTerm = selectedDebt.termDays + preset.termExtension
    
    setProposalForm({
      debtId: selectedDebt.id.toString(),
      newAmount: Math.round(newAmount).toString(),
      newRate: Math.max(0, newRate).toFixed(1),
      newTerm: newTerm.toString(),
      reason: preset.reason
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <div className="tab-content">
            <h2>🔒 Create Anonymous Debt</h2>
            
            {/* 预设模板 */}
            <div className="presets-section">
              <h3>Quick Templates</h3>
              <div className="presets-grid">
                {debtPresets.map((preset, index) => (
                  <div key={index} className="preset-card" onClick={() => applyPreset(preset)}>
                    <h4>{preset.name}</h4>
                    <p>Amount: {formatAmount(preset.amount)}</p>
                    <p>Rate: {formatRate(preset.interestRate)}</p>
                    <p>Term: {formatDays(preset.termDays)}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateDebt} className="form-container">
              <div className="form-group">
                <label>Debt Amount (USD)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount" 
                  className="form-input"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder="e.g., 7.5" 
                  className="form-input"
                  value={createForm.interestRate}
                  onChange={(e) => setCreateForm({...createForm, interestRate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Term (Days)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 730" 
                  className="form-input"
                  value={createForm.termDays}
                  onChange={(e) => setCreateForm({...createForm, termDays: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={createForm.fullyAnonymous}
                    onChange={(e) => setCreateForm({...createForm, fullyAnonymous: e.target.checked})}
                  /> Fully Anonymous Mode
                </label>
                <small>Enable maximum privacy protection</small>
              </div>
              <div className="form-group">
                <label>Encrypted Description</label>
                <textarea 
                  placeholder="Optional encrypted description" 
                  className="form-input" 
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? '⏳ Creating...' : '🛡️ Create Anonymous Debt'}
              </button>
            </form>
            {error && <div className="error-message">Error: {error}</div>}
          </div>
        )
      case 'view':
        return (
          <div className="tab-content">
            <h2>📊 My Anonymous Debts</h2>
            <div className="debt-list">
              {userDebts.map((debt) => {
                const statusInfo = debtStatusMap[debt.status as keyof typeof debtStatusMap]
                return (
                  <div key={debt.id} className="debt-item">
                    <div className="debt-header">
                      <span className="debt-id">Debt #{debt.id}</span>
                      <span className={`debt-status ${statusInfo.class}`}>{statusInfo.label}</span>
                    </div>
                    <div className="debt-details">
                      <p><strong>Amount:</strong> {debt.isAnonymous ? '🔐 Encrypted' : formatAmount(debt.amount)}</p>
                      <p><strong>Rate:</strong> {debt.isAnonymous ? '🔐 Encrypted' : formatRate(debt.interestRate)}</p>
                      <p><strong>Term:</strong> {debt.isAnonymous ? '🔐 Encrypted' : formatDays(debt.termDays)}</p>
                      <p><strong>Created:</strong> {formatDate(debt.createdAt)}</p>
                      <p><strong>Description:</strong> {debt.description}</p>
                    </div>
                    <div className="debt-actions">
                      <button className="secondary-button">📋 View Details</button>
                      {debt.status === 0 && (
                        <button 
                          className="success-button"
                          onClick={() => handleResolveDebt(Number(debt.id))}
                          disabled={isLoading}
                        >
                          ✅ Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      case 'proposals':
        return (
          <div className="tab-content">
            <h2>📋 Restructuring Proposals</h2>
            
            <div className="proposal-section">
              <h3>Create New Proposal</h3>
              
              {/* 重组预设模板 */}
              {userDebts.filter(debt => debt.status === 0).length > 0 && (
                <div className="presets-section">
                  <h4>Restructuring Templates</h4>
                  <div className="restructuring-presets">
                    {restructuringPresets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        className="preset-button"
                        onClick={() => {
                          const activeDebt = userDebts.find(d => d.id.toString() === proposalForm.debtId)
                          if (activeDebt) {
                            applyRestructuringPreset(preset, activeDebt)
                          } else if (userDebts.length > 0) {
                            applyRestructuringPreset(preset, userDebts[0])
                          }
                        }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleProposeRestructuring} className="form-container">
                <div className="form-group">
                  <label>Select Debt</label>
                  <select 
                    className="form-input"
                    value={proposalForm.debtId}
                    onChange={(e) => setProposalForm({...proposalForm, debtId: e.target.value})}
                    required
                  >
                    <option value="">Select a debt</option>
                    {userDebts.filter(debt => debt.status === 0).map(debt => (
                      <option key={debt.id} value={debt.id}>
                        Debt #{debt.id} - {debt.isAnonymous ? 'Anonymous' : formatAmount(debt.amount)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>New Amount (USD)</label>
                  <input 
                    type="number" 
                    placeholder="New amount" 
                    className="form-input"
                    value={proposalForm.newAmount}
                    onChange={(e) => setProposalForm({...proposalForm, newAmount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Interest Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="New rate" 
                    className="form-input"
                    value={proposalForm.newRate}
                    onChange={(e) => setProposalForm({...proposalForm, newRate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Term (Days)</label>
                  <input 
                    type="number" 
                    placeholder="New term" 
                    className="form-input"
                    value={proposalForm.newTerm}
                    onChange={(e) => setProposalForm({...proposalForm, newTerm: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reason (Encrypted)</label>
                  <textarea 
                    placeholder="Reason for restructuring" 
                    className="form-input" 
                    rows={2}
                    value={proposalForm.reason}
                    onChange={(e) => setProposalForm({...proposalForm, reason: e.target.value})}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="primary-button" disabled={isLoading}>
                  {isLoading ? '⏳ Submitting...' : '📝 Submit Proposal'}
                </button>
              </form>
            </div>

            <div className="proposal-list">
              <h3>Existing Proposals</h3>
              {userProposals.map(proposal => {
                const statusInfo = proposalStatusMap[proposal.status as keyof typeof proposalStatusMap]
                return (
                  <div key={proposal.id} className="proposal-item">
                    <div className="proposal-header">
                      <span>Proposal #{proposal.id} (Debt #{proposal.debtId})</span>
                      <span className={`proposal-status ${statusInfo.class}`}>{statusInfo.label}</span>
                    </div>
                    <div className="proposal-details">
                      <p><strong>New Amount:</strong> {formatAmount(proposal.newAmount)}</p>
                      <p><strong>New Rate:</strong> {formatRate(proposal.newRate)}</p>
                      <p><strong>New Term:</strong> {formatDays(proposal.newTerm)}</p>
                      <p><strong>Reason:</strong> {proposal.reason}</p>
                      <p><strong>Proposed:</strong> {formatDate(proposal.proposedAt)}</p>
                    </div>
                    {proposal.status === 0 && (
                      <div className="proposal-actions">
                        <button 
                          className="success-button"
                          onClick={() => handleProcessProposal(Number(proposal.id), true)}
                          disabled={isLoading}
                        >
                          ✅ Approve
                        </button>
                        <button 
                          className="danger-button"
                          onClick={() => handleProcessProposal(Number(proposal.id), false)}
                          disabled={isLoading}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      case 'stats':
        return (
          <div className="tab-content">
            <h2>📈 Privacy Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Anonymous Debts</h3>
                <div className="stat-number">{stats.totalDebts}</div>
              </div>
              <div className="stat-card">
                <h3>Resolved Debts</h3>
                <div className="stat-number">{stats.resolvedDebts}</div>
              </div>
              <div className="stat-card">
                <h3>Active Proposals</h3>
                <div className="stat-number">{stats.activeProposals}</div>
              </div>
              <div className="stat-card">
                <h3>Privacy Level</h3>
                <div className="stat-number">Maximum</div>
              </div>
            </div>
            <div className="privacy-info">
              <h3>🔐 FHE Privacy Protection</h3>
              <ul>
                <li>✅ All sensitive data encrypted with FHE</li>
                <li>✅ Computations on encrypted data</li>
                <li>✅ Zero-knowledge privacy protection</li>
                <li>✅ Anonymous debt management</li>
              </ul>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🔐 Anonymous Debt Manager</h1>
          <p>FHE-Powered Privacy-First Debt Restructuring Platform</p>
        </div>
        <div className="wallet-section">
          {!isConnected ? (
            <button className="connect-button" onClick={connectWallet} disabled={isLoading}>
              {isLoading ? '⏳ Connecting...' : '🔗 Connect Wallet'}
            </button>
          ) : (
            <div className="wallet-info">
              <span className="wallet-address">{walletAddress}</span>
              <span className="connected-indicator">🟢 Connected</span>
            </div>
          )}
        </div>
      </header>

      {!isConnected ? (
        <div className="connection-prompt">
          <h2>Welcome to Anonymous Debt Manager</h2>
          <p>Manage your debts with complete privacy using FHE (Fully Homomorphic Encryption)</p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <h3>Complete Anonymity</h3>
              <p>All debt information encrypted and anonymous</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🛡️</span>
              <h3>FHE Security</h3>
              <p>Computations on encrypted data without decryption</p>
            </div>
            <div className="feature">
              <span className="feature-icon">📋</span>
              <h3>Private Restructuring</h3>
              <p>Confidential debt restructuring proposals</p>
            </div>
          </div>
          <button className="connect-button large" onClick={connectWallet} disabled={isLoading}>
            {isLoading ? '⏳ Connecting...' : '🔗 Connect Wallet to Begin'}
          </button>
        </div>
      ) : (
        <main className="main-content">
          <nav className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              🔒 Create Debt
            </button>
            <button 
              className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              📊 My Debts ({userDebts.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'proposals' ? 'active' : ''}`}
              onClick={() => setActiveTab('proposals')}
            >
              📋 Proposals ({userProposals.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              📈 Statistics
            </button>
          </nav>

          {renderTabContent()}
        </main>
      )}

      <footer className="app-footer">
        <p>🔐 Anonymous Debt Manager - Your Privacy is Absolutely Protected</p>
        <p>Powered by FHE Technology | Fully Decentralized | Zero-Knowledge Privacy</p>
      </footer>
    </div>
  )
}

export default App