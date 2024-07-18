import { ethers } from 'ethers';
import config from '../config/base.config';
import { IS_MAINNET } from '../config/trade.config';

export const provider = new ethers.JsonRpcProvider(
  IS_MAINNET ? config.JSON_RPC_MAINNET : config.JSON_RPC_TESTNET,
);
