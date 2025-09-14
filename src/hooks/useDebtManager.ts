import { useState, useCallback, useEffect } from 'react'
import { DebtRecord, RestructuringProposal, CreateDebtForm, ProposeRestructuringForm, WalletConnection } from '@/types'
import { STATUS_MESSAGES, GAS_LIMITS, TRANSACTION_CONFIG, DEV_CONFIG, EXPLORER_URLS } from '@/constants'
import { parseContractError } from '@/utils'
import { 
  initializeFHE, 
  encryptDebtAmount, 
  encryptInterestRate, 
  isFHENetwork,
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

      // Load user debts
      const debtIds = await wallet.contract.getUserDebts(wallet.account)
      const debts: DebtRecord[] = []

      for (const debtId of debtIds) {
        const debtInfo = await wallet.contract.getDebtInfo(debtId)
        debts.push({
          id: Number(debtId),
          debtor: debtInfo[0],
          originalTerm: Number(debtInfo[1]),
          remainingTerm: Number(debtInfo[2]),
          createdAt: Number(debtInfo[3]),
          status: debtInfo[4],
          isAnonymous: debtInfo[5],
        })
      }
      setUserDebts(debts)

      // Load user proposals
      const proposalIds = await wallet.contract.getUserProposals(wallet.account)
      const proposals: RestructuringProposal[] = []

      for (const proposalId of proposalIds) {
        const proposalInfo = await wallet.contract.getProposalInfo(proposalId)
        proposals.push({
          id: Number(proposalId),
          debtId: Number(proposalInfo[0]),
          proposer: proposalInfo[1],
          newTerm: Number(proposalInfo[2]),
          proposedAt: Number(proposalInfo[3]),
          status: proposalInfo[4],
          reason: proposalInfo[5],
        })
      }
      setUserProposals(proposals)

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
        setStatus('Initializing FHE encryption...')

        // Initialize FHE if not already done
        await initializeFHE(wallet.provider)

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

        setStatus('Encrypting debt data with FHE...')

        // Encrypt the sensitive data
        const encryptedAmount = await encryptDebtAmount(amount)
        const encryptedRate = await encryptInterestRate(rate)

        setStatus(STATUS_MESSAGES.CREATING_DEBT)

        const params = [encryptedAmount, encryptedRate, termDays, formData.isAnonymous]
        
        const result = await executeTransaction(
          'createDebt',
          params,
          GAS_LIMITS.CREATE_DEBT,
          'Creating encrypted debt record'
        )

        if (result.success) {
          setStatus('Debt record created successfully! 🔐')
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
        setStatus('Initializing FHE encryption...')

        // Initialize FHE if not already done
        await initializeFHE(wallet.provider)

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

        setStatus('Encrypting restructuring data with FHE...')

        // Encrypt the sensitive data
        const encryptedAmount = await encryptDebtAmount(amount)
        const encryptedRate = await encryptInterestRate(rate)

        setStatus(STATUS_MESSAGES.PROPOSING_RESTRUCTURING)

        const params = [
          formData.selectedDebtId,
          encryptedAmount,
          encryptedRate,
          termDays,
          formData.reason || 'Debt restructuring request'
        ]
        
        const result = await executeTransaction(
          'proposeRestructuring',
          params,
          GAS_LIMITS.PROPOSE_RESTRUCTURING,
          'Submitting restructuring proposal'
        )

        if (result.success) {
          setStatus('Restructuring proposal submitted successfully! 📋')
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

        const params = [proposalId, approve]
        
        const result = await executeTransaction(
          'approveProposal',
          params,
          GAS_LIMITS.APPROVE_PROPOSAL,
          `${approve ? 'Approving' : 'Rejecting'} restructuring proposal`
        )

        if (result.success) {
          setStatus(`Proposal ${approve ? 'approved' : 'rejected'} successfully!`)
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

        const params = [debtId]
        
        const result = await executeTransaction(
          'markDebtResolved',
          params,
          GAS_LIMITS.MARK_RESOLVED,
          'Marking debt as resolved'
        )

        if (result.success) {
          setStatus('Debt marked as resolved successfully! ✅')
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