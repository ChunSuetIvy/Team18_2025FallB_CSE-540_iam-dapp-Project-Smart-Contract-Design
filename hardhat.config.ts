import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // ── Local Hardhat network (default) ──────────────────────────────────────
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // ── Polygon Amoy Testnet ──────────────────────────────────────────────────
    // Usage: npx hardhat run scripts/deploy.js --network amoy
    // Set AMOY_RPC_URL and AMOY_PRIVATE_KEY in a .env file
    amoy: {
      type: "http",
      chainType: "l1",
      url: "https://rpc-amoy.polygon.technology",
      accounts: [configVariable("AMOY_PRIVATE_KEY")],
    },
  },
});