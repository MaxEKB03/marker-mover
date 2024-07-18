import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import config from './src/config/base.config';
import { getWalletsByRange } from './src/network/address-factory';

const accounts = getWalletsByRange(0, 10).map((wallet) => wallet.privateKey);

const hardhatConfig: HardhatUserConfig = {
  defaultNetwork: config.DEFAULT_NETWORK,
  networks: {
    testnet: {
      url: config.JSON_RPC_TESTNET,
      chainId: 97,
      accounts,
    },
    mainnet: {
      url: config.JSON_RPC_MAINNET,
      chainId: 56,
      accounts,
    },
  },
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './src/contracts',
    tests: './src/test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default hardhatConfig;
