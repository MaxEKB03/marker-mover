import { ethers } from 'ethers';
import { IS_MAINNET } from '../src/config/trade.config';
import config from '../src/config/base.config';

export const provider = new ethers.JsonRpcProvider(
  IS_MAINNET ? config.JSON_RPC_MAINNET : config.JSON_RPC_TESTNET,
);
