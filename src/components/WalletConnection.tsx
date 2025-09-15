import React from 'react'

interface WalletConnectionProps {
  onConnect: () => void
  isLoading: boolean
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect, isLoading }) => {
  return (
    <div className="wallet-connection">
      <div className="connect-prompt">
        <p>&gt; Connect your MetaMask wallet to access the platform</p>
        <p>&gt; Your financial data will be encrypted and stored securely on-chain</p>
      </div>
      <button 
        className="connect-button"
        onClick={onConnect}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : '🦊 Connect MetaMask Wallet'}
      </button>
    </div>
  )
}

export default WalletConnection