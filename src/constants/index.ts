// Real Blockchain Configuration for Anonymous Debt Restructuring Platform

// IMPORTANT: Update this with your deployed contract address
export const CONTRACT_ADDRESS = '0x14e09216003ca55Bbe69884A9D27A52c584fE890' // AnonymousDebtManager FHE contract

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

// AnonymousDebtManager FHE contract ABI with anonymous debt restructuring functionality
export const CONTRACT_ABI = [
  // Anonymous Debt Management Functions
  'function createAnonymousDebt(uint256 amount, uint256 interestRate, uint256 termDays, bytes32 accessKey) external returns (uint256)',
  'function proposeAnonymousRestructuring(uint256 debtId, uint256 newAmount, uint256 newInterestRate, uint256 newTermDays, string calldata reason, bytes32 accessKey) external returns (uint256)',
  'function processAnonymousProposal(uint256 proposalId, bool approve, bytes32 accessKey) external',
  'function finalizeAnonymousDebt(uint256 debtId, bytes32 accessKey) external',
  'function enableAnonymousMode(uint256 debtId, bytes32 newAccessKey) external',
  'function disableAnonymousMode(uint256 debtId, bytes32 accessKey) external',
  
  // Privacy and Access Management
  'function grantAnonymousAccess(uint256 debtId, address user, bytes32 accessKey) external',
  'function revokeAnonymousAccess(uint256 debtId, address user, bytes32 accessKey) external',
  'function updateAnonymousAccessKey(uint256 debtId, bytes32 oldKey, bytes32 newKey) external',
  'function verifyAnonymousAccess(uint256 debtId, address user, bytes32 accessKey) external view returns (bool)',
  
  // FHE-Style Encrypted Data Functions
  'function getEncryptedDebtData(uint256 debtId, bytes32 accessKey) external view returns (bytes32, bytes32, bytes32)',
  'function getEncryptedProposalData(uint256 proposalId, bytes32 accessKey) external view returns (bytes32, bytes32, bytes32)',
  'function verifyEncryptedAmount(uint256 debtId, bytes32 expectedHash, bytes32 accessKey) external view returns (bool)',
  'function verifyEncryptedRate(uint256 debtId, bytes32 expectedHash, bytes32 accessKey) external view returns (bool)',
  
  // Anonymous View Functions (Privacy Protected)
  'function getAnonymousDebtInfo(uint256 debtId, bytes32 accessKey) external view returns (bytes32, bytes32, bytes32, uint256, uint256, uint8, bool)',
  'function getAnonymousProposalInfo(uint256 proposalId, bytes32 accessKey) external view returns (uint256, bytes32, bytes32, bytes32, uint256, uint8, bool, string)',
  'function getUserAnonymousDebts(address user, bytes32 accessKey) external view returns (uint256[])',
  'function getUserAnonymousProposals(address user, bytes32 accessKey) external view returns (uint256[])',
  
  // Public Statistics (Non-Identifying)
  'function getTotalAnonymousDebts() external view returns (uint256)',
  'function getTotalAnonymousProposals() external view returns (uint256)',
  'function getAnonymousDebtCount() external view returns (uint256)',
  'function getResolvedAnonymousCount() external view returns (uint256)',
  
  // Standard Functions
  'function owner() external view returns (address)',
  'function nextDebtId() external view returns (uint256)',
  'function nextProposalId() external view returns (uint256)',
  'function anonymousMode() external view returns (bool)',
  
  // Anonymous Events (Privacy-First)
  'event AnonymousDebtCreated(uint256 indexed debtId, bytes32 indexed encryptedDebtor, bytes32 encryptedAmount, bytes32 encryptedRate, uint256 timestamp)',
  'event AnonymousRestructuringProposed(uint256 indexed proposalId, uint256 indexed debtId, bytes32 indexed encryptedProposer, bytes32 encryptedAmount, uint256 timestamp)',
  'event AnonymousProposalProcessed(uint256 indexed proposalId, uint8 newStatus, bytes32 indexed encryptedProcessor, uint256 timestamp)',
  'event AnonymousDebtFinalized(uint256 indexed debtId, uint8 finalStatus, bytes32 indexed encryptedFinalizer, uint256 timestamp)',
  'event AnonymousAccessGranted(uint256 indexed debtId, bytes32 indexed encryptedUser, bytes32 accessKeyHash, uint256 timestamp)',
  'event AnonymousAccessRevoked(uint256 indexed debtId, bytes32 indexed encryptedUser, bytes32 accessKeyHash, uint256 timestamp)',
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