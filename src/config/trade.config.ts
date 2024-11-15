// import { FeeAmount } from '@uniswap/v3-sdk';
import config from './base.config';
// import { getDeployed } from '../../scripts/getDeployed';
import { Dex, DexVersion } from '../volume/dto/volume.projects';
import { RandomConfigure } from 'src/volume/dto/volume.dto';

export interface DexConfig {
  dex: Dex;
  dexVersion: DexVersion;
}

export enum Networks {
  arbitrum = 'arbitrum',
  bsc = 'mainnet',
  bsc_testnet = 'testnet',
}

export interface TradeConfigBase extends DexConfig {
  CHAIN_ID: number;

  USDT_ADDRESS: `0x${string}`; // USDT || another liquid token
  USDT_DECIMALS: number;
  TOKEN_ADDRESS: `0x${string}`;
  TOKEN_DECIMALS: number;

  BANK_ADDRESS: string;
  BOT_MANAGER: string;

  amountTypes: RandomConfigure;
  txsInHours?: number;

  sellMethod: string;
  buyMethod: string;

  scanerUrl: string;

  tradeDirection: boolean;
}

export interface DexV2 extends DexConfig {
  dexVersion: DexVersion.V2;
  FACTORY_ADDRESS: string;
  PAIR_ADDRESS: string;
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

export const IS_ARBITRUM = config.DEFAULT_NETWORK === 'arbitrum';
export const IS_MAINNET = config.DEFAULT_NETWORK === 'mainnet';

// const deployed = getDeployed();

// export const TRADE_CONFIG: TradeConfig = IS_MAINNET
//   ? // mainnet
//     {
//       CHAIN_ID: 56,

//       USDT_ADDRESS: deployed['TestTokens#SellToken'],
//       USDT_DECIMALS: 18,
//       TOKEN_ADDRESS: deployed['TestTokens#BuyToken'],
//       TOKEN_DECIMALS: 18,

//       BANK_ADDRESS: '0x7D89F5A712Fcc3968DbBAAF7a0c92e426e170C77',
//       BOT_MANAGER: deployed['BotManager#BotManager'],

//       dex: Dex.Uniswap,
//       dexVersion: DexVersion.V3,

//       FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
//       POOL_ADDRESS: deployed['Pool#Pancake'],
//       POOL_FEE: FeeAmount.LOWEST,

//       amountTypes: config.PROD
//         ? {
//             big: {
//               id: 0,
//               percent: 100,
//               data: [10, 50],
//             },
//           }
//         : {
//             small: {
//               id: 0,
//               percent: 100,
//               data: [2, 2],
//             },
//           },

//       sellMethod: 'sellV3',
//       buyMethod: 'buyV3',
//       scanerUrl: 'https://bscscan.com/tx/',
//     }
//   : // testnet
//     {
//       CHAIN_ID: 97,

//       USDT_ADDRESS: deployed['TestTokens#SellToken'],
//       USDT_DECIMALS: 18,
//       TOKEN_ADDRESS: deployed['TestTokens#BuyToken'],
//       TOKEN_DECIMALS: 18,

//       BANK_ADDRESS: '0x7D89F5A712Fcc3968DbBAAF7a0c92e426e170C77',
//       BOT_MANAGER: deployed['BotManager#BotManager'],

//       dex: Dex.Uniswap,
//       dexVersion: DexVersion.V3,

//       FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
//       POOL_ADDRESS: deployed['Pool#Pancake'],
//       POOL_FEE: FeeAmount.LOWEST,

//       amountTypes: config.PROD
//         ? {
//             big: {
//               id: 0,
//               percent: 100,
//               data: [10, 50],
//             },
//           }
//         : {
//             small: {
//               id: 0,
//               percent: 100,
//               data: [2, 2],
//             },
//           },

//       sellMethod: 'sellV3',
//       buyMethod: 'buyV3',
//       scanerUrl: 'https://bscscan.com/tx/',
//     };
