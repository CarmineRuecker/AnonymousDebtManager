import { ethers } from "hardhat"

async function main() {
  console.log("🚀 Deploying AnonymousDebtManager FHE contract...")

  // Get the contract factory
  const AnonymousDebtManager = await ethers.getContractFactory("AnonymousDebtManager")
  
  // Deploy the contract
  console.log("📦 Deploying contract...")
  const contract = await AnonymousDebtManager.deploy()
  
  // Wait for deployment
  await contract.waitForDeployment()
  
  const contractAddress = await contract.getAddress()
  
  console.log("✅ Contract deployed successfully!")
  console.log("📍 Contract address:", contractAddress)
  console.log("🌐 Network:", (await ethers.provider.getNetwork()).name)
  console.log("⛽ Deployer address:", await (await ethers.getSigners())[0].getAddress())
  
  // Log deployment info for frontend
  console.log("\n📋 Update your frontend constants:")
  console.log(`export const CONTRACT_ADDRESS = "${contractAddress}"`)
  
  // Verify deployment
  const owner = await contract.owner()
  const nextDebtId = await contract.nextDebtId()
  
  console.log("\n🔍 Contract verification:")
  console.log("Owner:", owner)
  console.log("Next Debt ID:", nextDebtId.toString())
  
  return contractAddress
}

main()
  .then((address) => {
    console.log("✨ Deployment completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })