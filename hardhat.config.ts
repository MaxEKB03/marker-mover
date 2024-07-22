import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import { getWalletsByRange } from './scripts/addressFactory';
import config from './src/config/base.config';
import './tasks';

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
};

export default hardhatConfig;
