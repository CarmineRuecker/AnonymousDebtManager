// Real Blockchain Configuration for Anonymous Debt Restructuring Platform

// IMPORTANT: Update this with your deployed contract address
export const CONTRACT_ADDRESS = '0x1BbD539D823242079D837C29878FAd11B8daF839' // Deployed contract

// Real Sepolia Network Configuration
export const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111

// Infura/Alchemy endpoints for Sepolia (add your API key)
export const SEPOLIA_RPC_URLS = [
  'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  'https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
  'https://sepolia.gateway.tenderly.co',
  'https://rpc.sepolia.org',
  'https://sepolia.etherscan.io/api',
]

export const SEPOLIA_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Test Network',
  rpcUrls: SEPOLIA_RPC_URLS,
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  iconUrls: ['https://sepolia.etherscan.io/images/svg/brands/ethereum-original.svg'],
}

// FHE Network Configuration
export const FHEVM_CHAIN_ID = '0x1F49' // 8009 in hex
export const FHEVM_CHAIN_ID_DECIMAL = 8009

export const FHEVM_CONFIG = {
  chainId: FHEVM_CHAIN_ID,
  chainName: 'FHEVM Network',
  rpcUrls: ['https://rpc.fhevm.xyz'],
  nativeCurrency: {
    name: 'ZAMA',
    symbol: 'ZAMA',
    decimals: 18,
  },
  blockExplorerUrls: ['https://explorer.fhevm.xyz/'],
  iconUrls: ['https://zama.ai/favicon.ico'],
}

// Real contract ABI for deployed AnonymousDebtManager FHE contract
export const CONTRACT_ABI = [
  // Write functions (updated for FHE)
  'function createDebt(bytes calldata _encryptedAmount, bytes calldata _encryptedInterestRate, uint256 _termInDays, bool _isAnonymous) external returns (uint256)',
  'function proposeRestructuring(uint256 _debtId, bytes calldata _newEncryptedAmount, bytes calldata _newEncryptedRate, uint256 _newTermInDays, string _reason) external returns (uint256)',
  'function approveProposal(uint256 _proposalId, bool _approve) external',
  'function executeProposal(uint256 _proposalId) external',
  'function markDebtResolved(uint256 _debtId) external',
  'function markDebtDefaulted(uint256 _debtId) external',
  'function setAuthorizedCreditor(address _creditor, bool _authorized) external',
  
  // View functions (updated for FHE)
  'function getDebtInfo(uint256 _debtId) external view returns (address, uint256, uint256, uint256, uint8, bool, bytes32)',
  'function getEncryptedDebtAmount(uint256 _debtId, bytes32 publicKey) external view returns (bytes memory)',
  'function getDecryptedDebtAmount(uint256 _debtId) external view returns (uint64)',
  'function getEncryptedInterestRate(uint256 _debtId, bytes32 publicKey) external view returns (bytes memory)',
  'function getDecryptedInterestRate(uint256 _debtId) external view returns (uint32)',
  'function getUserDebts(address _user) external view returns (uint256[])',
  'function getUserProposals(address _user) external view returns (uint256[])',
  'function getProposalInfo(uint256 _proposalId) external view returns (uint256, address, uint256, uint256, uint8, string, bool, bool)',
  'function getTotalDebts() external view returns (uint256)',
  'function getTotalProposals() external view returns (uint256)',
  
  // Public variables
  'function owner() external view returns (address)',
  'function nextDebtId() external view returns (uint256)',
  'function nextProposalId() external view returns (uint256)',
  'function authorizedCreditors(address) external view returns (bool)',
  
  // Events
  'event DebtCreated(uint256 indexed debtId, address indexed debtor, uint256 originalTerm, bool isAnonymous, uint256 timestamp)',
  'event RestructuringProposed(uint256 indexed proposalId, uint256 indexed debtId, address indexed proposer, uint256 newTerm, uint256 timestamp)',
  'event ProposalStatusChanged(uint256 indexed proposalId, uint8 newStatus, address indexed changedBy, uint256 timestamp)',
  'event DebtStatusChanged(uint256 indexed debtId, uint8 newStatus, address indexed changedBy, uint256 timestamp)',
  'event ApprovalGranted(uint256 indexed proposalId, address indexed approver, bool isCreditor, uint256 timestamp)',
]

// Gas Estimation Configuration
export const GAS_LIMITS = {
  CREATE_DEBT: 200000,
  PROPOSE_RESTRUCTURING: 250000,
  APPROVE_PROPOSAL: 100000,
  EXECUTE_PROPOSAL: 150000,
  MARK_RESOLVED: 80000,
  MARK_DEFAULTED: 80000,
}

// Transaction Configuration
export const TRANSACTION_CONFIG = {
  // Gas price in Gwei (will be estimated if not provided)
  maxFeePerGas: null, // Will use network estimation
  maxPriorityFeePerGas: null, // Will use network estimation
  
  // Confirmation blocks to wait
  confirmations: 1, // Sepolia is fast, 1 confirmation is usually enough
  
  // Timeout for transaction confirmation (in milliseconds)
  timeout: 300000, // 5 minutes
}

// Faucet URLs for getting Sepolia ETH
export const SEPOLIA_FAUCETS = [
  'https://sepoliafaucet.com/',
  'https://faucet.sepolia.dev/',
  'https://faucet.quicknode.com/sepolia',
  'https://www.alchemy.com/faucets/ethereum-sepolia',
  'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
]

// Real debt presets with actual values
export const DEBT_PRESETS = {
  'personal-loan': {
    amount: 5000,
    rate: 12.0,
    days: 730, // 2 years
    reason: 'Personal loan for home improvement',
    category: 'Personal',
  },
  'credit-card': {
    amount: 2500,
    rate: 18.0,
    days: 548, // 18 months
    reason: 'Credit card debt consolidation',
    category: 'Credit',
  },
  'student-loan': {
    amount: 15000,
    rate: 6.0,
    days: 3650, // 10 years
    reason: 'Student loan for education expenses',
    category: 'Education',
  },
  'business-loan': {
    amount: 25000,
    rate: 8.0,
    days: 1825, // 5 years
    reason: 'Small business working capital loan',
    category: 'Business',
  },
  'mortgage': {
    amount: 200000,
    rate: 4.0,
    days: 10950, // 30 years
    reason: 'Home mortgage financing',
    category: 'Real Estate',
  },
  'medical-debt': {
    amount: 8000,
    rate: 0.0,
    days: 1095, // 3 years
    reason: 'Medical expenses payment plan',
    category: 'Medical',
  },
}

export const RESTRUCTURE_PRESETS = {
  hardship: {
    factor: 0.8,
    rateFactor: 0.7,
    termFactor: 1.5,
    reason: 'Financial hardship due to unexpected circumstances - requesting reduced payments and extended term',
    category: 'Hardship',
  },
  'lower-rate': {
    factor: 1.0,
    rateFactor: 0.6,
    termFactor: 1.0,
    reason: 'Request for lower interest rate based on improved credit score and payment history',
    category: 'Rate Reduction',
  },
  'extend-term': {
    factor: 1.0,
    rateFactor: 1.0,
    termFactor: 2.0,
    reason: 'Requesting extended payment term to reduce monthly payment burden',
    category: 'Term Extension',
  },
  'reduce-principal': {
    factor: 0.7,
    rateFactor: 1.0,
    termFactor: 1.0,
    reason: 'Settlement offer - willing to pay reduced principal amount for immediate resolution',
    category: 'Principal Reduction',
  },
}

// Real blockchain status messages
export const STATUS_MESSAGES = {
  // Connection
  CONNECTING: 'Connecting to MetaMask wallet...',
  CONNECTED: 'Successfully connected to Sepolia testnet! 🌐',
  WALLET_NOT_FOUND: 'MetaMask wallet not found. Please install MetaMask browser extension.',
  WRONG_NETWORK: 'Please switch to Sepolia test network in MetaMask.',
  CONTRACT_NOT_DEPLOYED: 'Smart contract not deployed. Please deploy the AnonymousDebtManager contract first.',
  INSUFFICIENT_BALANCE: 'Insufficient ETH balance. Please get Sepolia ETH from a faucet.',
  
  // Loading
  LOADING_DATA: 'Loading your debt records from blockchain...',
  CHECKING_BALANCE: 'Checking wallet balance and network status...',
  ESTIMATING_GAS: 'Estimating gas fees for transaction...',
  
  // Transactions
  CREATING_DEBT: 'Creating encrypted debt record on Sepolia blockchain...',
  PROPOSING_RESTRUCTURING: 'Submitting restructuring proposal to blockchain...',
  APPROVING_PROPOSAL: 'Submitting approval to blockchain...',
  EXECUTING_PROPOSAL: 'Executing approved proposal on blockchain...',
  MARKING_RESOLVED: 'Marking debt as resolved on blockchain...',
  
  // Transaction states
  TRANSACTION_PENDING: 'Transaction submitted! Waiting for blockchain confirmation...',
  TRANSACTION_CONFIRMING: 'Transaction confirmed! Processing on network...',
  TRANSACTION_SUCCESS: 'Transaction completed successfully! ✅',
  TRANSACTION_FAILED: 'Transaction failed. Please check your wallet and try again.',
  TRANSACTION_REJECTED: 'Transaction was rejected by user.',
  
  // Gas and fees
  HIGH_GAS_WARNING: 'Gas fees are currently high. Consider waiting for lower fees.',
  GAS_ESTIMATION_FAILED: 'Could not estimate gas fees. Transaction may fail.',
  
  // Network
  NETWORK_CONGESTION: 'Network congestion detected. Transaction may take longer.',
  BLOCK_CONFIRMATION: 'Waiting for block confirmations...',
}

// Validation rules for real blockchain constraints
export const VALIDATION_RULES = {
  MIN_AMOUNT: 0.01, // Minimum $0.01
  MAX_AMOUNT: 10000000, // Maximum $10M
  MIN_RATE: 0, // 0% interest allowed
  MAX_RATE: 100, // 100% maximum interest
  MIN_TERM: 1, // 1 day minimum
  MAX_TERM: 36500, // 100 years maximum
  
  // Gas limits
  MIN_GAS_LIMIT: 21000,
  MAX_GAS_LIMIT: 1000000,
  
  // ETH balance requirements
  MIN_ETH_BALANCE: 0.001, // Minimum ETH for gas fees
  RECOMMENDED_ETH_BALANCE: 0.01, // Recommended ETH balance
}

// Formatting options
export const FORMAT_OPTIONS = {
  CURRENCY: {
    style: 'currency' as const,
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  PERCENTAGE: {
    style: 'percent' as const,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  DATE: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  DATETIME: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
}

// Contract deployment information
export const DEPLOYMENT_INFO = {
  COMPILER_VERSION: '0.8.19',
  OPTIMIZATION_RUNS: 200,
  DEPLOYMENT_COST_ESTIMATE: '0.02 ETH', // Estimated deployment cost
  CONTRACT_SIZE: 'Large', // Contract size category
  VERIFICATION_REQUIRED: true, // Etherscan verification recommended
}

// Real blockchain explorer URLs
export const EXPLORER_URLS = {
  BASE: 'https://sepolia.etherscan.io',
  TRANSACTION: 'https://sepolia.etherscan.io/tx',
  ADDRESS: 'https://sepolia.etherscan.io/address',
  CONTRACT: 'https://sepolia.etherscan.io/address',
  BLOCK: 'https://sepolia.etherscan.io/block',
}

// Development and testing
export const DEV_CONFIG = {
  ENABLE_CONSOLE_LOGS: true,
  MOCK_TRANSACTIONS: false, // Set to false for real blockchain
  SKIP_WALLET_CHECK: false, // Set to false for production
  DEBUG_MODE: process.env.NODE_ENV === 'development',
}