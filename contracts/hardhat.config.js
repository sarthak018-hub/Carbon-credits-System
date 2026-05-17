require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    amoy: {
      url: AMOY_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};
