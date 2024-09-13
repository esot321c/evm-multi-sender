import { ethers } from "hardhat";

async function main() {
  const MultiSender = await ethers.getContractFactory("MultiSender");
  const multiSender = await MultiSender.deploy();

  await multiSender.waitForDeployment();

  console.log("MultiSender deployed to:", await multiSender.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});