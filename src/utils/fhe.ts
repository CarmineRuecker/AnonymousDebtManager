import { FhenixClient, EncryptionTypes } from "fhenixjs"

// Initialize FHE client
let fhenixClient: FhenixClient | null = null

export const initializeFHE = async (provider: any): Promise<FhenixClient> => {
  if (!fhenixClient) {
    fhenixClient = new FhenixClient({ provider })
  }
  return fhenixClient
}

export const getFHEClient = (): FhenixClient => {
  if (!fhenixClient) {
    throw new Error("FHE client not initialized. Call initializeFHE first.")
  }
  return fhenixClient
}

// Encrypt a number to euint64 (for amounts)
export const encryptAmount = async (value: number): Promise<string> => {
  const client = getFHEClient()
  const encrypted = await client.encrypt(value, EncryptionTypes.uint64)
  return encrypted
}

// Encrypt a number to euint32 (for interest rates in basis points)
export const encryptRate = async (value: number): Promise<string> => {
  const client = getFHEClient()
  const encrypted = await client.encrypt(value, EncryptionTypes.uint32)
  return encrypted
}

// Convert amount to wei equivalent for smart contract
export const convertToWeiEquivalent = (amount: number): number => {
  // Convert dollars to cents to avoid floating point issues
  return Math.round(amount * 100)
}

// Convert rate percentage to basis points
export const convertToBasisPoints = (rate: number): number => {
  // Convert percentage to basis points (1% = 100 basis points)
  return Math.round(rate * 100)
}

// Encrypt debt amount for contract
export const encryptDebtAmount = async (amountUSD: number): Promise<string> => {
  const weiEquivalent = convertToWeiEquivalent(amountUSD)
  return await encryptAmount(weiEquivalent)
}

// Encrypt interest rate for contract
export const encryptInterestRate = async (ratePercent: number): Promise<string> => {
  const basisPoints = convertToBasisPoints(ratePercent)
  return await encryptRate(basisPoints)
}

// Decrypt amount from wei equivalent back to USD
export const convertFromWeiEquivalent = (weiEquivalent: number): number => {
  return weiEquivalent / 100
}

// Convert basis points back to percentage
export const convertFromBasisPoints = (basisPoints: number): number => {
  return basisPoints / 100
}

// Generate public key for sealing outputs
export const generatePublicKey = async (): Promise<string> => {
  const client = getFHEClient()
  return await client.generatePublicKey()
}

// Unseal encrypted data
export const unsealData = async (sealedData: string, privateKey: string): Promise<number> => {
  const client = getFHEClient()
  return await client.unseal(sealedData, privateKey)
}

// Utility to check if we're on FHE-compatible network
export const isFHENetwork = (chainId: number): boolean => {
  return chainId === 8009 // FHEVM testnet
}

// Format encrypted data for display
export const formatEncryptedData = (data: string): string => {
  if (!data || data === "0x") {
    return "No data"
  }
  return `${data.slice(0, 10)}...${data.slice(-8)}`
}

// Validation helpers
export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000000 // $0 to $10M
}

export const validateRate = (rate: number): boolean => {
  return rate >= 0 && rate <= 100 // 0% to 100%
}

export const validateTerm = (days: number): boolean => {
  return days >= 1 && days <= 36500 // 1 day to 100 years
}