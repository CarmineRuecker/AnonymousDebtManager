import { DebtInfo, ProposalInfo } from '../hooks/useContract'

// Mock debt data
export const mockDebts: DebtInfo[] = [
  {
    id: 1,
    debtor: "0x1234567890123456789012345678901234567890",
    amount: 5000,
    interestRate: 7.5,
    termDays: 730,
    createdAt: Date.now() - 86400000 * 30, // 30 days ago
    status: 0, // ACTIVE
    isAnonymous: false,
    description: "Personal loan for debt consolidation"
  },
  {
    id: 2,
    debtor: "0x0000000000000000000000000000000000000000", // Anonymous
    amount: 12000,
    interestRate: 8.2,
    termDays: 1095,
    createdAt: Date.now() - 86400000 * 15, // 15 days ago
    status: 0, // ACTIVE
    isAnonymous: true,
    description: "🔐 Encrypted: Business restructuring loan"
  },
  {
    id: 3,
    debtor: "0x1234567890123456789012345678901234567890",
    amount: 3500,
    interestRate: 6.8,
    termDays: 365,
    createdAt: Date.now() - 86400000 * 60, // 60 days ago
    status: 1, // RESOLVED
    isAnonymous: false,
    description: "Emergency medical expenses"
  },
  {
    id: 4,
    debtor: "0x0000000000000000000000000000000000000000", // Anonymous
    amount: 8500,
    interestRate: 9.1,
    termDays: 1460,
    createdAt: Date.now() - 86400000 * 45, // 45 days ago
    status: 3, // RESTRUCTURED
    isAnonymous: true,
    description: "🔐 Encrypted: Educational loan restructuring"
  }
]

// Mock proposal data
export const mockProposals: ProposalInfo[] = [
  {
    id: 1,
    debtId: 1,
    proposer: "0x1234567890123456789012345678901234567890",
    newAmount: 4200,
    newRate: 6.5,
    newTerm: 900,
    proposedAt: Date.now() - 86400000 * 5, // 5 days ago
    status: 0, // PENDING
    creditorApproved: false,
    debtorApproved: true,
    reason: "Reduced income due to job change, requesting lower rate and extended term"
  },
  {
    id: 2,
    debtId: 2,
    proposer: "0x0000000000000000000000000000000000000000", // Anonymous
    newAmount: 10000,
    newRate: 7.0,
    newTerm: 1200,
    proposedAt: Date.now() - 86400000 * 3, // 3 days ago
    status: 0, // PENDING
    creditorApproved: false,
    debtorApproved: false,
    reason: "🔐 Encrypted: Financial hardship restructuring request"
  },
  {
    id: 3,
    debtId: 1,
    proposer: "0x1234567890123456789012345678901234567890",
    newAmount: 4500,
    newRate: 7.0,
    newTerm: 800,
    proposedAt: Date.now() - 86400000 * 10, // 10 days ago
    status: 2, // REJECTED
    creditorApproved: false,
    debtorApproved: true,
    reason: "Previous restructuring attempt - terms not acceptable to creditor"
  },
  {
    id: 4,
    debtId: 4,
    proposer: "0x0000000000000000000000000000000000000000", // Anonymous
    newAmount: 7500,
    newRate: 8.0,
    newTerm: 1300,
    proposedAt: Date.now() - 86400000 * 20, // 20 days ago
    status: 3, // EXECUTED
    creditorApproved: true,
    debtorApproved: true,
    reason: "🔐 Encrypted: Successful restructuring agreement"
  }
]

// Debt status mapping
export const debtStatusMap = {
  0: { label: 'ACTIVE', class: 'active' },
  1: { label: 'RESOLVED', class: 'resolved' },
  2: { label: 'DEFAULTED', class: 'defaulted' },
  3: { label: 'RESTRUCTURED', class: 'restructured' }
}

// Proposal status mapping
export const proposalStatusMap = {
  0: { label: 'PENDING', class: 'pending' },
  1: { label: 'APPROVED', class: 'approved' },
  2: { label: 'REJECTED', class: 'rejected' },
  3: { label: 'EXECUTED', class: 'executed' }
}

// Debt preset templates
export const debtPresets = [
  {
    name: "Personal Consumer Loan",
    amount: 5000,
    interestRate: 7.5,
    termDays: 730,
    description: "Personal consumption and debt consolidation loan"
  },
  {
    name: "Small Business Working Capital",
    amount: 15000,
    interestRate: 8.5,
    termDays: 1095,
    description: "Small business operating capital turnover loan"
  },
  {
    name: "Education Loan",
    amount: 8000,
    interestRate: 6.8,
    termDays: 1460,
    description: "Higher education tuition and living expenses loan"
  },
  {
    name: "Medical Emergency Loan",
    amount: 3000,
    interestRate: 9.2,
    termDays: 365,
    description: "Emergency medical expenses loan"
  },
  {
    name: "Home Renovation Loan",
    amount: 12000,
    interestRate: 7.8,
    termDays: 1095,
    description: "Housing renovation and improvement loan"
  }
]

// Restructuring proposal templates
export const restructuringPresets = [
  {
    name: "Lower Interest Rate",
    amountReduction: 0,
    rateReduction: 1.5,
    termExtension: 365,
    reason: "Request to lower interest rate to reduce repayment pressure"
  },
  {
    name: "Reduce Principal",
    amountReduction: 0.2, // Reduce by 20%
    rateReduction: 0,
    termExtension: 0,
    reason: "Request to reduce partial principal due to decreased income"
  },
  {
    name: "Extend Term",
    amountReduction: 0,
    rateReduction: 0,
    termExtension: 730,
    reason: "Request to extend repayment term to lower monthly payments"
  },
  {
    name: "Comprehensive Restructuring",
    amountReduction: 0.1, // Reduce by 10%
    rateReduction: 1.0,
    termExtension: 365,
    reason: "Comprehensive debt restructuring request: lower rate, reduce principal, and extend term"
  }
]

// Formatting functions
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`
}

export const formatDays = (days: number): string => {
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  
  if (years > 0) {
    return months > 0 ? `${years}y ${months}m` : `${years} years`
  }
  return months > 0 ? `${months} months` : `${days} days`
}

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US')
}