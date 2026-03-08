const hre = require("hardhat");

async function main() {

  console.log("Deploying contract...");

  const DiplomaRegistry = await hre.ethers.getContractFactory("DiplomaRegistry");

  const diplomaRegistry = await DiplomaRegistry.deploy();

  await diplomaRegistry.waitForDeployment();

  const address = await diplomaRegistry.getAddress();

  console.log("DiplomaRegistry deployed to:", address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
