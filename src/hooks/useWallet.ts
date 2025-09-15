import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { WalletConnection } from '@/types'
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CONFIG,
  STATUS_MESSAGES,
  VALIDATION_RULES,
  DEV_CONFIG,
  EXPLORER_URLS,
} from '@/constants'
import { parseContractError } from '@/utils'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
      removeAllListeners: (event: string) => void
    }
  }
}

interface WalletState {
  balance: string
  chainId: string | null
  isConnecting: boolean
  lastTransactionHash: string | null
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletConnection>({
    account: null,
    provider: null,
    signer: null,
    contract: null,
    isConnected: false,
    chainId: null,
  })

  const [walletState, setWalletState] = useState<WalletState>({
    balance: '0',
    chainId: null,
    isConnecting: false,
    lastTransactionHash: null,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enhanced status setting with console logging
  const setStatus = useCallback((message: string, isError = false) => {
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`[Wallet] ${isError ? 'ERROR' : 'INFO'}:`, message)
    }

    if (isError) {
      setError(message)
    } else {
      setError(null)
    }
  }, [])

  // Check if MetaMask is installed and available
  const checkMetaMaskAvailability = useCallback((): boolean => {
    if (!window.ethereum) {
      setStatus(STATUS_MESSAGES.WALLET_NOT_FOUND, true)
      return false
    }

    if (!window.ethereum.isMetaMask) {
      setStatus('Please use MetaMask wallet for the best experience.', false)
    }

    return true
  }, [setStatus])

  // Get wallet balance in ETH
  const getWalletBalance = useCallback(async (provider: ethers.BrowserProvider, address: string): Promise<string> => {
    try {
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error('[Wallet] Balance check failed:', error)
      }
      return '0'
    }
  }, [])

  // Check if user has sufficient ETH for gas fees
  const checkSufficientBalance = useCallback((balance: string): boolean => {
    const balanceNum = parseFloat(balance)
    if (balanceNum < VALIDATION_RULES.MIN_ETH_BALANCE) {
      setStatus(STATUS_MESSAGES.INSUFFICIENT_BALANCE, true)
      return false
    }
    return true
  }, [setStatus])

  // Switch or add Sepolia network
  const switchToSepolia = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false

    try {
      // First try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      })
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] Successfully switched to Sepolia')
      }
      return true

    } catch (switchError: any) {
      // If Sepolia is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_CONFIG],
          })
          
          if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
            console.log('[Wallet] Successfully added Sepolia to MetaMask')
          }
          return true

        } catch (addError: any) {
          if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
            console.error('[Wallet] Failed to add Sepolia:', addError)
          }
          setStatus('Failed to add Sepolia network to MetaMask.', true)
          return false
        }
      } else {
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.error('[Wallet] Failed to switch networks:', switchError)
        }
        setStatus(parseContractError(switchError), true)
        return false
      }
    }
  }, [setStatus])

  // Validate contract deployment
  const validateContract = useCallback(async (provider: ethers.BrowserProvider): Promise<boolean> => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.length !== 42) {
      setStatus(STATUS_MESSAGES.CONTRACT_NOT_DEPLOYED, true)
      return false
    }

    try {
      // Check if contract exists at the address
      const code = await provider.getCode(CONTRACT_ADDRESS)
      if (code === '0x') {
        setStatus('Smart contract not found at the specified address. Please verify deployment.', true)
        return false
      }

      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] Contract validated at address:', CONTRACT_ADDRESS)
      }
      return true

    } catch (error) {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error('[Wallet] Contract validation failed:', error)
      }
      setStatus('Failed to validate smart contract.', true)
      return false
    }
  }, [setStatus])

  // Main wallet connection function
  const connectWallet = useCallback(async (): Promise<boolean> => {
    if (!checkMetaMaskAvailability()) return false

    try {
      setIsLoading(true)
      setWalletState(prev => ({ ...prev, isConnecting: true }))
      setStatus(STATUS_MESSAGES.CONNECTING)

      // Request account access - this will trigger MetaMask popup
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        setStatus('No accounts found. Please create an account in MetaMask.', true)
        return false
      }

      const account = accounts[0]
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] Connected to account:', account)
      }

      // Check current network
      setStatus('Checking network connection...')
      const chainId = await window.ethereum!.request({ method: 'eth_chainId' })
      
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus('Switching to Sepolia test network...')
        const switched = await switchToSepolia()
        if (!switched) return false
      }

      // Initialize ethers provider and signer
      setStatus('Initializing blockchain connection...')
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()

      // Get wallet balance
      setStatus(STATUS_MESSAGES.CHECKING_BALANCE)
      const balance = await getWalletBalance(provider, account)
      
      if (!checkSufficientBalance(balance)) {
        // Still connect but show warning
        const faucetLink = 'https://sepoliafaucet.com'
        setStatus(`Low ETH balance (${parseFloat(balance).toFixed(4)} ETH). Get free Sepolia ETH from: ${faucetLink}`, true)
      }

      // Validate contract deployment
      const contractValid = await validateContract(provider)
      if (!contractValid) return false

      // Initialize contract
      setStatus('Connecting to smart contract...')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      // Test contract connection by calling a view function
      try {
        const totalDebts = await contract.getTotalDebts?.() || 0
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.log('[Wallet] Contract connection successful, total debts:', totalDebts.toString())
        }
      } catch (error) {
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.error('[Wallet] Contract test call failed:', error)
        }
        setStatus('Smart contract is not responding. Please check deployment.', true)
        return false
      }

      // Update wallet state
      setWallet({
        account,
        provider,
        signer,
        contract,
        isConnected: true,
        chainId: SEPOLIA_CHAIN_ID,
      })

      setWalletState({
        balance,
        chainId: SEPOLIA_CHAIN_ID,
        isConnecting: false,
        lastTransactionHash: null,
      })

      setStatus(STATUS_MESSAGES.CONNECTED)

      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] Connection complete:', {
          account,
          balance: `${balance} ETH`,
          chainId: SEPOLIA_CHAIN_ID,
          contract: CONTRACT_ADDRESS,
        })
      }

      return true

    } catch (error: any) {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error('[Wallet] Connection failed:', error)
      }

      if (error.code === 4001) {
        setStatus('Connection was rejected by user.', true)
      } else if (error.code === -32002) {
        setStatus('MetaMask is already processing a request. Please check MetaMask.', true)
      } else {
        const errorMessage = parseContractError(error)
        setStatus(`Connection failed: ${errorMessage}`, true)
      }
      
      return false
    } finally {
      setIsLoading(false)
      setWalletState(prev => ({ ...prev, isConnecting: false }))
    }
  }, [
    checkMetaMaskAvailability,
    switchToSepolia,
    getWalletBalance,
    checkSufficientBalance,
    validateContract,
    setStatus,
  ])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log('[Wallet] Disconnecting wallet')
    }

    setWallet({
      account: null,
      provider: null,
      signer: null,
      contract: null,
      isConnected: false,
      chainId: null,
    })

    setWalletState({
      balance: '0',
      chainId: null,
      isConnecting: false,
      lastTransactionHash: null,
    })

    setError(null)
  }, [])

  // Add transaction to state for tracking
  const addTransaction = useCallback((txHash: string) => {
    setWalletState(prev => ({ ...prev, lastTransactionHash: txHash }))
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`[Wallet] Transaction added: ${EXPLORER_URLS.TRANSACTION}/${txHash}`)
    }
  }, [])

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!wallet.provider || !wallet.account) return

    try {
      const balance = await getWalletBalance(wallet.provider, wallet.account)
      setWalletState(prev => ({ ...prev, balance }))
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log(`[Wallet] Balance refreshed: ${balance} ETH`)
      }
    } catch (error) {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error('[Wallet] Balance refresh failed:', error)
      }
    }
  }, [wallet.provider, wallet.account, getWalletBalance])

  // Handle MetaMask events
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] Accounts changed:', accounts)
      }

      if (accounts.length === 0) {
        // User disconnected
        disconnectWallet()
        setStatus('Wallet disconnected by user.', false)
      } else if (accounts[0] !== wallet.account) {
        // User switched accounts - reload the page for clean state
        window.location.reload()
      }
    }

    const handleChainChanged = (chainId: string) => {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] Chain changed to:', chainId)
      }

      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus(STATUS_MESSAGES.WRONG_NETWORK, true)
        setWallet(prev => ({ ...prev, isConnected: false }))
      } else {
        // Reload the page to reinitialize with correct network
        window.location.reload()
      }
    }

    const handleConnect = (connectInfo: { chainId: string }) => {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] MetaMask connected:', connectInfo)
      }
    }

    const handleDisconnect = (error: { code: number; message: string }) => {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[Wallet] MetaMask disconnected:', error)
      }
      disconnectWallet()
    }

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    window.ethereum.on('connect', handleConnect)
    window.ethereum.on('disconnect', handleDisconnect)

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
        window.ethereum.removeListener('connect', handleConnect)
        window.ethereum.removeListener('disconnect', handleDisconnect)
      }
    }
  }, [wallet.account, disconnectWallet, setStatus])

  // Auto-connect if already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum || wallet.isConnected) return

      try {
        // Check if already connected
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts && accounts.length > 0) {
          if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
            console.log('[Wallet] Auto-connecting to existing session')
          }
          await connectWallet()
        }
      } catch (error) {
        // Silent fail - user hasn't connected yet
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.log('[Wallet] No existing session found')
        }
      }
    }

    // Small delay to ensure MetaMask is fully loaded
    const timer = setTimeout(autoConnect, 100)
    return () => clearTimeout(timer)
  }, [connectWallet, wallet.isConnected])

  return {
    wallet,
    walletState,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    addTransaction,
    refreshBalance,
    setStatus,
  }
}