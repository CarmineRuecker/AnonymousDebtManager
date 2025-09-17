const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AnonymousDebtManager contract...");

  // Get the contract factory
  const AnonymousDebtManager = await ethers.getContractFactory("AnonymousDebtManager");

  // Deploy the contract
  const contract = await AnonymousDebtManager.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("AnonymousDebtManager deployed to:", contractAddress);

  // Verify contract on blockchain explorer if needed
  console.log("\nContract deployment completed!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: (await ethers.provider.getNetwork()).name,
    deploymentTime: new Date().toISOString(),
    contractName: "AnonymousDebtManager"
  };
  
  console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });