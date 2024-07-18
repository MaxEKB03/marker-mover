import { FeeAmount } from '@uniswap/v3-sdk';
import config from './base.config';

export interface TradeConfig {
  USDT_ADDRESS: string;
  USDT_DECIMALS: number;

  TOKEN_ADDRESS: string;
  TOKEN_DECIMALS: number;

  FACTORY_ADDRESS: string;
  POOL_ADDRESS: string;
  POOL_FEE: number;

  SLIPPAGE_TOLERANCE: number; // 50 = 0.5
}

export const IS_MAINNET = config.DEFAULT_NETWORK === 'mainnet';

export const TRADE_CONFIG = IS_MAINNET
  ? // mainnet
    {
      CHAIN_ID: 56,
      USDT_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
      USDT_DECIMALS: 18,

      TOKEN_ADDRESS: '',
      TOKEN_DECIMALS: 18,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: '',
      POOL_FEE: FeeAmount.MEDIUM,
    }
  : // testnet
    {
      CHAIN_ID: 97,
      USDT_ADDRESS: '0x418B99dCB7c006C192561AB2420190Eb2F91f472',
      USDT_DECIMALS: 6,

      TOKEN_ADDRESS: '0x1239366DFeDF0364c4BDFEdfb297ce55eB6Ef730',
      TOKEN_DECIMALS: 6,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: '0xB736D811E7C0Cb268092AeFd3d427129062a19cd',
      POOL_FEE: FeeAmount.LOW,

      PATH: '0x418b99dcb7c006c192561ab2420190eb2f91f4720001f41239366dfedf0364c4bdfedfb297ce55eb6ef730',
    };
