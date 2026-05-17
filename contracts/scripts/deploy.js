const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying CarbonCreditMRV to Polygon Amoy...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Deploy CarbonCreditMRV
  const CarbonCreditMRV = await hre.ethers.getContractFactory("CarbonCreditMRV");
  const contract = await CarbonCreditMRV.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ CarbonCreditMRV deployed to: ${contractAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: "amoy",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  // Save ABI to frontend
  const abi = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/CarbonCreditMRV.sol/CarbonCreditMRV.json"), "utf8")).abi;
  const abiPath = path.join(__dirname, "../../frontend/src/abi/CarbonCreditMRV.json");
  
  // Create abi directory if it doesn't exist
  const abiDir = path.dirname(abiPath);
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`📄 ABI saved to frontend: ${abiPath}`);

  console.log("\n✨ Deployment successful!");
  console.log(`\n📋 Add to frontend .env.local:`);
  console.log(`REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`REACT_APP_NETWORK_ID=80002`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
