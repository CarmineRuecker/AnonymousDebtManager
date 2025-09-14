// Utility Functions for Anonymous Debt Restructuring Platform

import { DebtStatus, ProposalStatus } from '@/types'
import { FORMAT_OPTIONS } from '@/constants'

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', FORMAT_OPTIONS.CURRENCY).format(amount)
}

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', FORMAT_OPTIONS.DATE)
}

export const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const getDebtStatusText = (status: DebtStatus): string => {
  const statusMap = {
    [DebtStatus.ACTIVE]: '🟢 Active',
    [DebtStatus.RESTRUCTURING]: '🟡 Restructuring',
    [DebtStatus.RESOLVED]: '✅ Resolved',
    [DebtStatus.DEFAULTED]: '🔴 Defaulted',
  }
  return statusMap[status] || 'Unknown'
}

export const getProposalStatusText = (status: ProposalStatus): string => {
  const statusMap = {
    [ProposalStatus.PENDING]: '⏳ Pending',
    [ProposalStatus.ACCEPTED]: '✅ Accepted',
    [ProposalStatus.REJECTED]: '❌ Rejected',
    [ProposalStatus.EXECUTED]: '🚀 Executed',
  }
  return statusMap[status] || 'Unknown'
}

export const validateAmount = (amount: string): string | null => {
  const num = parseFloat(amount)
  if (isNaN(num)) return 'Amount must be a valid number'
  if (num <= 0) return 'Amount must be greater than 0'
  if (num > 10000000) return 'Amount is too large'
  return null
}

export const validateInterestRate = (rate: string): string | null => {
  const num = parseFloat(rate)
  if (isNaN(num)) return 'Interest rate must be a valid number'
  if (num < 0) return 'Interest rate cannot be negative'
  if (num > 100) return 'Interest rate cannot exceed 100%'
  return null
}

export const validateTerm = (term: string): string | null => {
  const num = parseInt(term)
  if (isNaN(num)) return 'Term must be a valid number'
  if (num <= 0) return 'Term must be greater than 0 days'
  if (num > 36500) return 'Term cannot exceed 100 years'
  return null
}

export const parseContractError = (error: any): string => {
  if (error?.reason) return error.reason
  if (error?.message) {
    // Parse common error patterns
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected by user'
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction'
    }
    if (error.message.includes('gas')) {
      return 'Transaction failed due to gas limit'
    }
    return error.message
  }
  return 'Unknown error occurred'
}

export const convertToContractUnits = (amount: number): number => {
  return Math.floor(amount * 100) // Convert to cents
}

export const convertToBasisPoints = (rate: number): number => {
  return Math.floor(rate * 100) // Convert to basis points
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  termInDays: number
): number => {
  if (annualRate === 0) return principal / (termInDays / 30.44) // Average days per month
  
  const monthlyRate = annualRate / 100 / 12
  const numPayments = termInDays / 30.44
  
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  )
}

export const calculateTotalInterest = (
  principal: number,
  annualRate: number,
  termInDays: number
): number => {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termInDays)
  const totalPayments = termInDays / 30.44
  return monthlyPayment * totalPayments - principal
}

export const formatPercentage = (rate: number): string => {
  return `${rate.toFixed(2)}%`
}

export const formatDays = (days: number): string => {
  if (days < 30) return `${days} days`
  if (days < 365) return `${Math.round(days / 30.44)} months`
  return `${Math.round(days / 365)} years`
}

export const getStatusColor = (status: DebtStatus | ProposalStatus): string => {
  switch (status) {
    case DebtStatus.ACTIVE:
    case ProposalStatus.ACCEPTED:
    case ProposalStatus.EXECUTED:
      return 'var(--primary-green)'
    case DebtStatus.RESTRUCTURING:
    case ProposalStatus.PENDING:
      return 'var(--warning-orange)'
    case DebtStatus.RESOLVED:
      return 'var(--primary-blue)'
    case DebtStatus.DEFAULTED:
    case ProposalStatus.REJECTED:
      return 'var(--danger-red)'
    default:
      return 'var(--text-secondary)'
  }
}