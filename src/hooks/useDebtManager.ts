import { useState, useCallback, useEffect } from 'react'
import { DebtRecord, RestructuringProposal, CreateDebtForm, ProposeRestructuringForm, WalletConnection } from '@/types'
import { STATUS_MESSAGES, GAS_LIMITS, TRANSACTION_CONFIG, DEV_CONFIG, EXPLORER_URLS } from '@/constants'
import { parseContractError } from '@/utils'
import { 
  validateAmount,
  validateRate,
  validateTerm
} from '@/utils/fhe'

export const useDebtManager = (wallet: WalletConnection, addTransaction?: (txHash: string) => void) => {
  const [userDebts, setUserDebts] = useState<DebtRecord[]>([])
  const [userProposals, setUserProposals] = useState<RestructuringProposal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null)
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null)

  const setStatus = useCallback((message: string, isError = false) => {
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`[AnonymousDebtManager] ${isError ? 'ERROR' : 'INFO'}:`, message)
    }

    if (isError) {
      setError(message)
      setTransactionStatus(null)
    } else {
      setError(null)
      setTransactionStatus(message)
    }
  }, [])

  // Gas estimation helper
  const estimateGas = useCallback(async (contractMethod: string, params: any[], gasLimit: number) => {
    if (!wallet.provider || !wallet.contract) return null

    try {
      setStatus(STATUS_MESSAGES.ESTIMATING_GAS)
      
      // Get current gas price
      const feeData = await wallet.provider.getFeeData()
      const gasPrice = feeData.gasPrice || BigInt('20000000000') // 20 gwei fallback
      
      // Estimate gas for the transaction
      let estimatedGas: bigint
      try {
        estimatedGas = await wallet.contract[contractMethod].estimateGas(...params)
      } catch (error) {
        // Use default gas limit if estimation fails
        estimatedGas = BigInt(gasLimit)
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.warn('[AnonymousDebtManager] Gas estimation failed, using default:', gasLimit)
        }
      }
      
      // Add 20% buffer to estimated gas
      const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100)
      const totalCost = gasWithBuffer * gasPrice
      const costInEth = Number(totalCost) / 1e18
      
      const gasInfo = `Gas: ${gasWithBuffer.toString()}, Cost: ~${costInEth.toFixed(6)} ETH`
      setEstimatedGas(gasInfo)
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('[AnonymousDebtManager] Gas estimation:', {
          method: contractMethod,
          estimatedGas: estimatedGas.toString(),
          gasWithBuffer: gasWithBuffer.toString(),
          gasPrice: gasPrice.toString(),
          costInEth: costInEth.toFixed(6)
        })
      }
      
      return {
        gasLimit: gasWithBuffer,
        gasPrice,
        costInEth
      }
    } catch (error) {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error('[AnonymousDebtManager] Gas estimation error:', error)
      }
      setStatus(STATUS_MESSAGES.GAS_ESTIMATION_FAILED, true)
      return null
    }
  }, [wallet.provider, wallet.contract, setStatus])

  // Transaction execution helper with proper confirmation handling
  const executeTransaction = useCallback(async (
    contractMethod: string,
    params: any[],
    gasLimit: number,
    description: string
  ) => {
    if (!wallet.contract || !wallet.signer) {
      throw new Error('Contract or signer not available')
    }

    try {
      // Estimate gas first
      const gasEstimate = await estimateGas(contractMethod, params, gasLimit)
      if (!gasEstimate) {
        throw new Error('Failed to estimate gas fees')
      }

      setStatus(`${description} - Preparing transaction...`)
      
      // Execute the transaction with estimated gas
      const tx = await wallet.contract[contractMethod](...params, {
        gasLimit: gasEstimate.gasLimit,
        maxFeePerGas: TRANSACTION_CONFIG.maxFeePerGas,
        maxPriorityFeePerGas: TRANSACTION_CONFIG.maxPriorityFeePerGas,
      })
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log(`[AnonymousDebtManager] Transaction submitted:`, {
          method: contractMethod,
          hash: tx.hash,
          gasLimit: gasEstimate.gasLimit.toString()
        })
      }
      
      // Add transaction to tracking
      if (addTransaction) {
        addTransaction(tx.hash)
      }
      
      setStatus(STATUS_MESSAGES.TRANSACTION_PENDING)
      setEstimatedGas(null)
      
      // Wait for confirmation
      setStatus(STATUS_MESSAGES.TRANSACTION_CONFIRMING)
      const receipt = await tx.wait(TRANSACTION_CONFIG.confirmations)
      
      if (receipt.status === 1) {
        setStatus(STATUS_MESSAGES.TRANSACTION_SUCCESS)
        
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.log(`[AnonymousDebtManager] Transaction confirmed:`, {
            hash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed?.toString(),
            explorerUrl: `${EXPLORER_URLS.TRANSACTION}/${tx.hash}`
          })
        }
        
        return { success: true, receipt, hash: tx.hash }
      } else {
        throw new Error('Transaction failed during execution')
      }
      
    } catch (error: any) {
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error(`[AnonymousDebtManager] Transaction failed:`, error)
      }
      
      if (error.code === 4001) {
        throw new Error(STATUS_MESSAGES.TRANSACTION_REJECTED)
      } else {
        throw new Error(`${STATUS_MESSAGES.TRANSACTION_FAILED}: ${parseContractError(error)}`)
      }
    }
  }, [wallet.contract, wallet.signer, estimateGas, addTransaction, setStatus])

  const loadUserData = useCallback(async () => {
    if (!wallet.isConnected || !wallet.contract || !wallet.account) return

    try {
      setIsLoading(true)
      setStatus(STATUS_MESSAGES.LOADING_DATA)

      // Generate anonymous access key for this session
      const anonymousAccessKey = `0x${Math.random().toString(16).substr(2, 64)}`

      // Load user anonymous debts
      try {
        const debtIds = await wallet.contract.getUserAnonymousDebts(wallet.account, anonymousAccessKey)
        const debts: DebtRecord[] = []

        for (const debtId of debtIds) {
          try {
            const debtInfo = await wallet.contract.getAnonymousDebtInfo(debtId, anonymousAccessKey)
            debts.push({
              id: Number(debtId),
              debtor: wallet.account,
              amount: Number(debtInfo[3]) / 100, // Convert from cents
              interestRate: Number(debtInfo[4]) / 100, // Convert from basis points
              originalTerm: Number(debtInfo[4]),
              remainingTerm: Number(debtInfo[4]),
              createdAt: Number(debtInfo[3]),
              status: debtInfo[5],
              isAnonymous: debtInfo[6],
            })
          } catch (error) {
            // Skip debts we don't have access to
            if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
              console.warn('[AnonymousDebtManager] No access to debt:', debtId)
            }
          }
        }
        setUserDebts(debts)
      } catch (error) {
        // Fallback to empty array if no anonymous debts
        setUserDebts([])
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.log('[AnonymousDebtManager] No anonymous debts found for user')
        }
      }

      // Load user anonymous proposals
      try {
        const proposalIds = await wallet.contract.getUserAnonymousProposals(wallet.account, anonymousAccessKey)
        const proposals: RestructuringProposal[] = []

        for (const proposalId of proposalIds) {
          try {
            const proposalInfo = await wallet.contract.getAnonymousProposalInfo(proposalId, anonymousAccessKey)
            proposals.push({
              id: Number(proposalId),
              debtId: Number(proposalInfo[0]),
              proposer: wallet.account,
              newAmount: Number(proposalInfo[1]) / 100, // Convert from cents  
              newRate: Number(proposalInfo[2]) / 100, // Convert from basis points
              newTerm: Number(proposalInfo[3]),
              proposedAt: Number(proposalInfo[4]),
              status: proposalInfo[5],
              reason: proposalInfo[7],
            })
          } catch (error) {
            // Skip proposals we don't have access to
            if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
              console.warn('[AnonymousDebtManager] No access to proposal:', proposalId)
            }
          }
        }
        setUserProposals(proposals)
      } catch (error) {
        // Fallback to empty array if no anonymous proposals
        setUserProposals([])
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.log('[AnonymousDebtManager] No anonymous proposals found for user')
        }
      }

      setStatus('Data loaded successfully!')
    } catch (error: any) {
      const errorMessage = parseContractError(error)
      setStatus(`Failed to load data: ${errorMessage}`, true)
    } finally {
      setIsLoading(false)
    }
  }, [wallet, setStatus])

  const createDebt = useCallback(
    async (formData: CreateDebtForm) => {
      if (!wallet.isConnected || !wallet.contract || !wallet.provider) {
        setStatus('Please connect your wallet first!', true)
        return false
      }

      try {
        setIsLoading(true)
        setStatus('Preparing FHE-style debt creation...')

        const amount = parseFloat(formData.amount)
        const rate = parseFloat(formData.interestRate)
        const termDays = parseInt(formData.termDays)

        // Validate inputs
        if (!validateAmount(amount)) {
          throw new Error('Amount must be between $0.01 and $10,000,000')
        }
        if (!validateRate(rate)) {
          throw new Error('Interest rate must be between 0% and 100%')
        }
        if (!validateTerm(termDays)) {
          throw new Error('Term must be between 1 day and 100 years')
        }

        setStatus(STATUS_MESSAGES.CREATING_DEBT)

        // Convert to contract format (cents and basis points)
        const amountInCents = Math.round(amount * 100)
        const rateInBasisPoints = Math.round(rate * 100)

        // Generate anonymous access key for privacy
        const anonymousAccessKey = `0x${Math.random().toString(16).substr(2, 64)}`

        const params = [amountInCents, rateInBasisPoints, termDays, anonymousAccessKey]
        
        const result = await executeTransaction(
          'createAnonymousDebt',
          params,
          GAS_LIMITS.CREATE_DEBT,
          'Creating anonymous encrypted debt record'
        )

        if (result.success) {
          setStatus('Anonymous FHE-style debt record created successfully! 🔐👤')
          await loadUserData()
          return true
        }
        return false
      } catch (error: any) {
        setStatus(error.message || `Failed to create debt: ${parseContractError(error)}`, true)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [wallet, setStatus, loadUserData, executeTransaction]
  )

  const proposeRestructuring = useCallback(
    async (formData: ProposeRestructuringForm) => {
      if (!wallet.isConnected || !wallet.contract || !wallet.provider) {
        setStatus('Please connect your wallet first!', true)
        return false
      }

      try {
        setIsLoading(true)
        setStatus('Preparing restructuring proposal...')

        const amount = parseFloat(formData.newAmount)
        const rate = parseFloat(formData.newRate)
        const termDays = parseInt(formData.newTerm)

        // Validate inputs
        if (!validateAmount(amount)) {
          throw new Error('New amount must be between $0.01 and $10,000,000')
        }
        if (!validateRate(rate)) {
          throw new Error('New interest rate must be between 0% and 100%')
        }
        if (!validateTerm(termDays)) {
          throw new Error('New term must be between 1 day and 100 years')
        }

        setStatus(STATUS_MESSAGES.PROPOSING_RESTRUCTURING)

        // Convert to contract format (cents and basis points)
        const amountInCents = Math.round(amount * 100)
        const rateInBasisPoints = Math.round(rate * 100)

        // Generate anonymous access key for privacy
        const anonymousAccessKey = `0x${Math.random().toString(16).substr(2, 64)}`

        const params = [
          parseInt(formData.selectedDebtId),
          amountInCents,
          rateInBasisPoints,
          termDays,
          formData.reason || 'Anonymous debt restructuring request',
          anonymousAccessKey
        ]
        
        const result = await executeTransaction(
          'proposeAnonymousRestructuring',
          params,
          GAS_LIMITS.PROPOSE_RESTRUCTURING,
          'Submitting anonymous restructuring proposal'
        )

        if (result.success) {
          setStatus('Anonymous FHE-style restructuring proposal submitted successfully! 🔐📋👤')
          await loadUserData()
          return true
        }
        return false
      } catch (error: any) {
        setStatus(error.message || `Failed to submit proposal: ${parseContractError(error)}`, true)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [wallet, setStatus, loadUserData, executeTransaction]
  )

  const approveProposal = useCallback(
    async (proposalId: number, approve: boolean) => {
      if (!wallet.isConnected || !wallet.contract) {
        setStatus('Please connect your wallet first!', true)
        return false
      }

      try {
        setIsLoading(true)
        setStatus(STATUS_MESSAGES.APPROVING_PROPOSAL)

        // Generate anonymous access key for privacy
        const anonymousAccessKey = `0x${Math.random().toString(16).substr(2, 64)}`

        const params = [proposalId, approve, anonymousAccessKey]
        
        const result = await executeTransaction(
          'processAnonymousProposal',
          params,
          GAS_LIMITS.APPROVE_PROPOSAL,
          `${approve ? 'Approving' : 'Rejecting'} anonymous restructuring proposal`
        )

        if (result.success) {
          setStatus(`Anonymous proposal ${approve ? 'approved' : 'rejected'} successfully! 👤`)
          await loadUserData()
          return true
        }
        return false
      } catch (error: any) {
        setStatus(error.message || `Failed to ${approve ? 'approve' : 'reject'} proposal: ${parseContractError(error)}`, true)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [wallet, setStatus, loadUserData, executeTransaction]
  )

  const executeProposal = useCallback(
    async (proposalId: number) => {
      if (!wallet.isConnected || !wallet.contract) {
        setStatus('Please connect your wallet first!', true)
        return false
      }

      try {
        setIsLoading(true)
        setStatus(STATUS_MESSAGES.EXECUTING_PROPOSAL)

        const params = [proposalId]
        
        const result = await executeTransaction(
          'executeProposal',
          params,
          GAS_LIMITS.EXECUTE_PROPOSAL,
          'Executing approved restructuring proposal'
        )

        if (result.success) {
          setStatus('Proposal executed successfully! 🚀')
          await loadUserData()
          return true
        }
        return false
      } catch (error: any) {
        setStatus(error.message || `Failed to execute proposal: ${parseContractError(error)}`, true)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [wallet, setStatus, loadUserData, executeTransaction]
  )

  const markDebtResolved = useCallback(
    async (debtId: number) => {
      if (!wallet.isConnected || !wallet.contract) {
        setStatus('Please connect your wallet first!', true)
        return false
      }

      try {
        setIsLoading(true)
        setStatus(STATUS_MESSAGES.MARKING_RESOLVED)

        // Generate anonymous access key for privacy
        const anonymousAccessKey = `0x${Math.random().toString(16).substr(2, 64)}`

        const params = [debtId, anonymousAccessKey]
        
        const result = await executeTransaction(
          'finalizeAnonymousDebt',
          params,
          GAS_LIMITS.MARK_RESOLVED,
          'Finalizing anonymous debt resolution'
        )

        if (result.success) {
          setStatus('Anonymous debt finalized successfully! ✅👤')
          await loadUserData()
          return true
        }
        return false
      } catch (error: any) {
        setStatus(error.message || `Failed to resolve debt: ${parseContractError(error)}`, true)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [wallet, setStatus, loadUserData, executeTransaction]
  )

  // Load data when wallet connects
  useEffect(() => {
    if (wallet.isConnected) {
      loadUserData()
    }
  }, [wallet.isConnected, loadUserData])

  return {
    userDebts,
    userProposals,
    isLoading,
    error,
    transactionStatus,
    estimatedGas,
    createDebt,
    proposeRestructuring,
    approveProposal,
    executeProposal,
    markDebtResolved,
    loadUserData,
    setStatus,
    estimateGas,
  }
}