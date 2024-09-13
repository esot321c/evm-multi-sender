import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "tsconfig-paths/register";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    // base: {
    //   url: "https://mainnet.base.org",
    //   accounts: [process.env.PRIVATE_KEY!],
    // },
    // baseGoerli: {
    //   url: "https://goerli.base.org",
    //   accounts: [process.env.PRIVATE_KEY!],
    // },
  }
};

export default config;