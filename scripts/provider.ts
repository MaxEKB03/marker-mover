import { ethers } from 'ethers';
import { Networks } from '../src/config/trade.config';
import config from '../src/config/base.config';

const getNetworkInfo = (): [string, { name: string; chainId: number }] => {
  let rpc;
  let meatadata;

  switch (config.DEFAULT_NETWORK) {
    case Networks.arbitrum:
      rpc = config.JSON_RPC_ARBITRUM;
      meatadata = { name: 'Arbitrum', chainId: 42161 };
      break;
    case Networks.bsc:
      rpc = config.JSON_RPC_MAINNET;
      meatadata = { name: 'BSC', chainId: 56 };
      break;
    default:
      rpc = config.JSON_RPC_TESTNET;
      meatadata = { name: 'BSC-testnet', chainId: 97 };
  }
  return [rpc, meatadata];
};

export const provider = new ethers.JsonRpcProvider(...getNetworkInfo());
