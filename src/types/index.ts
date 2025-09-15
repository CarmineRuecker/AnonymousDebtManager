// Core Types for Anonymous Debt Restructuring Platform

export interface WalletConnection {
  account: string | null
  provider: any
  signer: any
  contract: any
  isConnected: boolean
  chainId: string | null
}

export enum DebtStatus {
  ACTIVE = 0,
  RESTRUCTURING = 1,
  RESOLVED = 2,
  DEFAULTED = 3,
}

export enum ProposalStatus {
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
  EXECUTED = 3,
}

export interface DebtRecord {
  id: number
  debtor: string
  amount: number
  interestRate: number
  originalTerm: number
  remainingTerm: number
  createdAt: number
  status: DebtStatus
  isAnonymous: boolean
}

export interface RestructuringProposal {
  id: number
  debtId: number
  proposer: string
  newAmount: number
  newRate: number
  newTerm: number
  proposedAt: number
  status: ProposalStatus
  reason: string
}

export interface DebtPreset {
  amount: number
  rate: number
  days: number
  reason: string
}

export interface RestructurePreset {
  factor: number
  rateFactor: number
  termFactor: number
  reason: string
}

export interface AppState {
  currentTab: 'create' | 'view' | 'propose'
  userDebts: DebtRecord[]
  userProposals: RestructuringProposal[]
  isLoading: boolean
  error: string | null
}

export interface CreateDebtForm {
  amount: string
  interestRate: string
  termDays: string
  isAnonymous: boolean
}

export interface ProposeRestructuringForm {
  selectedDebtId: string
  newAmount: string
  newRate: string
  newTerm: string
  reason: string
}

export interface ContractError extends Error {
  reason?: string
  code?: string
}

export interface TransactionResponse {
  hash: string
  wait: () => Promise<TransactionReceipt>
}

export interface TransactionReceipt {
  status: number
  transactionHash: string
  blockNumber: number
}