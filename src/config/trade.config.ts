import { FeeAmount } from '@uniswap/v3-sdk';
import config from './base.config';
import { getDeployed } from '../../scripts/getDeployed';

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

const deployed = getDeployed();

export const TRADE_CONFIG = IS_MAINNET
  ? // mainnet
    {
      CHAIN_ID: 56,
      USDT_ADDRESS: deployed['TestTokens#SellToken'],
      USDT_DECIMALS: 18,

      TOKEN_ADDRESS: deployed['TestTokens#BuyToken'],
      TOKEN_DECIMALS: 18,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: deployed['Pool#Pancake'],
      POOL_FEE: FeeAmount.LOWEST,

      BOT_MANAGER: deployed['BotManager#BotManager'],
    }
  : // testnet
    {
      CHAIN_ID: 97,
      USDT_ADDRESS: deployed['TestTokens#SellToken'],
      USDT_DECIMALS: 18,

      TOKEN_ADDRESS: deployed['TestTokens#BuyToken'],
      TOKEN_DECIMALS: 18,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: deployed['Pool#Pancake'],
      POOL_FEE: FeeAmount.LOWEST,

      BOT_MANAGER: deployed['BotManager#BotManager'],
    };
