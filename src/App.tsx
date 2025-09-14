import React, { useState } from 'react'
import { useWallet, useDebtManager } from '@/hooks'
import { CONTRACT_ADDRESS } from '@/constants'
import { formatAddress } from '@/utils'
import Header from '@/components/Header'
import StatusMessage from '@/components/StatusMessage'
import WalletConnection from '@/components/WalletConnection'
import DebtPresets from '@/components/DebtPresets'
import TabNavigation from '@/components/TabNavigation'
import CreateDebtForm from '@/components/CreateDebtForm'
import ViewDebts from '@/components/ViewDebts'
import ProposeRestructuringForm from '@/components/ProposeRestructuringForm'
import './App.css'

type TabType = 'create' | 'view' | 'propose'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('create')
  const wallet = useWallet()
  const debtManager = useDebtManager(wallet.wallet, wallet.addTransaction)

  const error = wallet.error || debtManager.error
  const isLoading = wallet.isLoading || debtManager.isLoading

  return (
    <div className="app">
      <div className="terminal-box">
        <Header />

        {/* Platform Info */}
        <div className="blockchain-info">
          <p>
            &gt; <strong>PRIVACY-FIRST DEBT MANAGEMENT</strong> - Powered by Blockchain Encryption!
          </p>
          <p>
            &gt; Contract:{' '}
            <span className="highlight">
              {wallet.wallet.isConnected
                ? formatAddress(CONTRACT_ADDRESS)
                : 'Not Connected'}
            </span>
          </p>
          <p>
            &gt; Network: <span className="highlight">Sepolia Testnet</span>
          </p>
        </div>

        {/* Terminal Description */}
        <div className="terminal-text">
          <p>&gt; Welcome to the Anonymous Debt Restructuring Platform.</p>
          <p>&gt; Manage your debts privately using blockchain encryption technology.</p>
          <p>&gt; All financial data is encrypted on-chain - complete privacy guaranteed.</p>
          <p>&gt; Create debt records, propose restructuring terms, and resolve debts securely.</p>
          <p>&gt; Your financial information remains confidential at every step.</p>
        </div>

        {/* Status Message */}
        <StatusMessage 
          message={error || debtManager.transactionStatus || 'Ready to manage debts anonymously!'} 
          isError={!!error} 
        />
        
        {/* Gas Estimation Display */}
        {debtManager.estimatedGas && (
          <div className="gas-estimation">
            <span className="highlight">⛽ Gas Estimation:</span> {debtManager.estimatedGas}
          </div>
        )}

        {/* Wallet Connection */}
        {!wallet.wallet.isConnected && (
          <WalletConnection onConnect={wallet.connectWallet} isLoading={isLoading} />
        )}

        {/* Main Interface - Only show when connected */}
        {wallet.wallet.isConnected && (
          <>
            {/* Debt Presets */}
            <DebtPresets onTabChange={setActiveTab} />

            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              debtCount={debtManager.userDebts.length}
            />

            {/* Tab Content */}
            {activeTab === 'create' && (
              <CreateDebtForm
                onSubmit={debtManager.createDebt}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'view' && (
              <ViewDebts
                debts={debtManager.userDebts}
                proposals={debtManager.userProposals}
                onMarkResolved={debtManager.markDebtResolved}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'propose' && (
              <ProposeRestructuringForm
                debts={debtManager.userDebts}
                onSubmit={debtManager.proposeRestructuring}
                isLoading={isLoading}
              />
            )}

            {/* Connected Wallet Display */}
            <div className="button-group">
              <button className="wallet-button connected" disabled>
                🔐 {formatAddress(wallet.wallet.account || '')}
              </button>
              <button 
                className="wallet-button"
                onClick={wallet.refreshBalance}
                disabled={isLoading}
              >
                💰 {wallet.walletState.balance.slice(0, 8)} ETH
              </button>
              {wallet.walletState.lastTransactionHash && (
                <button 
                  className="wallet-button"
                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${wallet.walletState.lastTransactionHash}`, '_blank')}
                >
                  🔍 View Last Transaction
                </button>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="footer">
          <p>&gt; Anonymous Debt Management - Your Privacy is Protected!</p>
          <p>&gt; Powered by Blockchain Encryption Technology</p>
        </div>
      </div>
    </div>
  )
}

export default App