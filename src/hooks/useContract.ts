import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// Anonymous Debt Manager合约ABI（简化版）
const CONTRACT_ABI = [
  "function createAnonymousDebt(uint256 amount, uint256 interestRate, uint256 termDays, bool fullyAnonymous, string calldata encryptedDescription) external returns (uint256)",
  "function proposeAnonymousRestructuring(uint256 debtId, uint256 newAmount, uint256 newInterestRate, uint256 newTermDays, string calldata encryptedReason) external returns (uint256)",
  "function processAnonymousProposal(uint256 proposalId, bool approve) external",
  "function resolveAnonymousDebt(uint256 debtId) external",
  "function getAnonymousDebtInfo(uint256 debtId) external view returns (address, uint256, uint256, uint256, uint256, uint8, bool, string memory)",
  "function getAnonymousProposalInfo(uint256 proposalId) external view returns (uint256, address, uint256, uint256, uint256, uint256, uint8, bool, bool, string memory)",
  "function getUserDebts(address user) external view returns (uint256[] memory)",
  "function getUserProposals(address user) external view returns (uint256[] memory)",
  "function getAnonymousStats() external view returns (uint256, uint256, uint256)",
  "event AnonymousDebtCreated(uint256 indexed debtId, address indexed debtor, bytes32 encryptedDataHash, bool isFullyAnonymous, uint256 timestamp)",
  "event AnonymousProposalSubmitted(uint256 indexed proposalId, uint256 indexed debtId, address indexed proposer, bytes32 encryptedProposalHash, uint256 timestamp)"
]

// 合约地址（需要部署后替换）
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890" // 示例地址

export interface DebtInfo {
  id: number
  debtor: string
  amount: number
  interestRate: number
  termDays: number
  createdAt: number
  status: number
  isAnonymous: boolean
  description: string
}

export interface ProposalInfo {
  id: number
  debtId: number
  proposer: string
  newAmount: number
  newRate: number
  newTerm: number
  proposedAt: number
  status: number
  creditorApproved: boolean
  debtorApproved: boolean
  reason: string
}

export const useContract = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!window.ethereum) {
        throw new Error('Please install MetaMask wallet')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      setProvider(provider)
      setSigner(signer)
      setContract(contract)

      return await signer.getAddress()
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createDebt = async (
    amount: number,
    interestRate: number,
    termDays: number,
    fullyAnonymous: boolean,
    description: string
  ) => {
    if (!contract) throw new Error('Contract not connected')
    
    try {
      setIsLoading(true)
      setError(null)

      // 转换利率为基点（例如7.5% = 750）
      const rateInBasisPoints = Math.floor(interestRate * 100)
      
      const tx = await contract.createAnonymousDebt(
        amount,
        rateInBasisPoints,
        termDays,
        fullyAnonymous,
        description
      )

      const receipt = await tx.wait()
      
      // 从事件中获取债务ID
      const debtCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === contract.interface.getEventTopic('AnonymousDebtCreated')
      )
      
      if (debtCreatedEvent) {
        const parsedEvent = contract.interface.parseLog(debtCreatedEvent)
        return {
          transactionHash: receipt.hash,
          debtId: parsedEvent.args.debtId.toString()
        }
      }

      return { transactionHash: receipt.hash }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const proposeRestructuring = async (
    debtId: number,
    newAmount: number,
    newRate: number,
    newTerm: number,
    reason: string
  ) => {
    if (!contract) throw new Error('Contract not connected')
    
    try {
      setIsLoading(true)
      setError(null)

      const rateInBasisPoints = Math.floor(newRate * 100)
      
      const tx = await contract.proposeAnonymousRestructuring(
        debtId,
        newAmount,
        rateInBasisPoints,
        newTerm,
        reason
      )

      const receipt = await tx.wait()
      return { transactionHash: receipt.hash }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const processProposal = async (proposalId: number, approve: boolean) => {
    if (!contract) throw new Error('Contract not connected')
    
    try {
      setIsLoading(true)
      setError(null)

      const tx = await contract.processAnonymousProposal(proposalId, approve)
      const receipt = await tx.wait()
      return { transactionHash: receipt.hash }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resolveDebt = async (debtId: number) => {
    if (!contract) throw new Error('Contract not connected')
    
    try {
      setIsLoading(true)
      setError(null)

      const tx = await contract.resolveAnonymousDebt(debtId)
      const receipt = await tx.wait()
      return { transactionHash: receipt.hash }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getUserDebts = async (userAddress: string): Promise<DebtInfo[]> => {
    if (!contract) return []
    
    try {
      const debtIds = await contract.getUserDebts(userAddress)
      const debts: DebtInfo[] = []

      for (const id of debtIds) {
        try {
          const debtInfo = await contract.getAnonymousDebtInfo(id)
          debts.push({
            id: id.toString(),
            debtor: debtInfo[0],
            amount: parseInt(debtInfo[1].toString()),
            interestRate: parseInt(debtInfo[2].toString()) / 100, // 转换回百分比
            termDays: parseInt(debtInfo[3].toString()),
            createdAt: parseInt(debtInfo[4].toString()),
            status: parseInt(debtInfo[5].toString()),
            isAnonymous: debtInfo[6],
            description: debtInfo[7]
          })
        } catch (err) {
          console.log(`无法获取债务 ${id} 的信息:`, err)
        }
      }

      return debts
    } catch (err: any) {
      setError(err.message)
      return []
    }
  }

  const getUserProposals = async (userAddress: string): Promise<ProposalInfo[]> => {
    if (!contract) return []
    
    try {
      const proposalIds = await contract.getUserProposals(userAddress)
      const proposals: ProposalInfo[] = []

      for (const id of proposalIds) {
        try {
          const proposalInfo = await contract.getAnonymousProposalInfo(id)
          proposals.push({
            id: id.toString(),
            debtId: parseInt(proposalInfo[0].toString()),
            proposer: proposalInfo[1],
            newAmount: parseInt(proposalInfo[2].toString()),
            newRate: parseInt(proposalInfo[3].toString()) / 100,
            newTerm: parseInt(proposalInfo[4].toString()),
            proposedAt: parseInt(proposalInfo[5].toString()),
            status: parseInt(proposalInfo[6].toString()),
            creditorApproved: proposalInfo[7],
            debtorApproved: proposalInfo[8],
            reason: proposalInfo[9]
          })
        } catch (err) {
          console.log(`无法获取提案 ${id} 的信息:`, err)
        }
      }

      return proposals
    } catch (err: any) {
      setError(err.message)
      return []
    }
  }

  const getStats = async () => {
    if (!contract) return { totalDebts: 0, resolvedDebts: 0, activeProposals: 0 }
    
    try {
      const stats = await contract.getAnonymousStats()
      return {
        totalDebts: parseInt(stats[0].toString()),
        resolvedDebts: parseInt(stats[1].toString()),
        activeProposals: parseInt(stats[2].toString())
      }
    } catch (err: any) {
      setError(err.message)
      return { totalDebts: 0, resolvedDebts: 0, activeProposals: 0 }
    }
  }

  return {
    contract,
    provider,
    signer,
    isLoading,
    error,
    connectWallet,
    createDebt,
    proposeRestructuring,
    processProposal,
    resolveDebt,
    getUserDebts,
    getUserProposals,
    getStats
  }
}

// 声明全局类型
declare global {
  interface Window {
    ethereum?: any
  }
}