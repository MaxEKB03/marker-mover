import { FeeAmount } from '@uniswap/v3-sdk';
import config from './base.config';
import { getDeployed } from '../../scripts/getDeployed';
import { Dex, DexVersion } from '../volume/dto/volume.projects';

export interface DexConfig {
  dex: Dex;
  dexVersion: DexVersion;
}

export interface TradeConfigBase extends DexConfig {
  CHAIN_ID: number;

  USDT_ADDRESS: string; // USDT || another liquid token
  USDT_DECIMALS: number;
  TOKEN_ADDRESS: string;
  TOKEN_DECIMALS: number;

  BOT_MANAGER: string;
}

export interface DexV2 extends DexConfig {
  dexVersion: DexVersion.V2;
}

export interface DexV3 extends DexConfig {
  dexVersion: DexVersion.V3;
  FACTORY_ADDRESS: string;
  POOL_ADDRESS: string;
  POOL_FEE: number;
}

export interface UniswapV2 extends DexV2 {
  dex: Dex.Uniswap;
}
export interface UniswapV3 extends DexV3 {
  dex: Dex.Uniswap;
}
export interface PancakeV2 extends DexV2 {
  dex: Dex.Pancake;
}
export interface PancakeV3 extends DexV3 {
  dex: Dex.Pancake;
}

export type TradeConfigV3 = TradeConfigBase & DexV3;
export type TradeConfigV2 = TradeConfigBase & DexV2;
export type TradeConfig = TradeConfigV3 | TradeConfigV2;

export const IS_MAINNET = config.DEFAULT_NETWORK === 'mainnet';

const deployed = getDeployed();

export const TRADE_CONFIG: TradeConfig = IS_MAINNET
  ? // mainnet
    {
      CHAIN_ID: 56,

      USDT_ADDRESS: deployed['TestTokens#SellToken'],
      USDT_DECIMALS: 18,
      TOKEN_ADDRESS: deployed['TestTokens#BuyToken'],
      TOKEN_DECIMALS: 18,

      BOT_MANAGER: deployed['BotManager#BotManager'],

      dex: Dex.Uniswap,
      dexVersion: DexVersion.V3,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: deployed['Pool#Pancake'],
      POOL_FEE: FeeAmount.LOWEST,
    }
  : // testnet
    {
      CHAIN_ID: 97,

      USDT_ADDRESS: deployed['TestTokens#SellToken'],
      USDT_DECIMALS: 18,
      TOKEN_ADDRESS: deployed['TestTokens#BuyToken'],
      TOKEN_DECIMALS: 18,

      BOT_MANAGER: deployed['BotManager#BotManager'],

      dex: Dex.Uniswap,
      dexVersion: DexVersion.V3,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: deployed['Pool#Pancake'],
      POOL_FEE: FeeAmount.LOWEST,
    };
