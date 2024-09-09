import { RandomConfigure, WalletRange } from './volume.dto';
import { JsonRpcProvider, Provider } from 'ethers';
import { TradeConfig } from '../../config/trade.config';
import { FeeAmount } from '@uniswap/v3-sdk';
import config from '../../config/base.config';

export enum DexVersion {
  V2,
  V3,
}

export enum Dex {
  Pancake,
  Uniswap,
}

export type Project = {
  id: string;
  managerId: number;
  walletRange: WalletRange;
  provider: Provider;
  tradeConfig: TradeConfig;
  AmountTypes: RandomConfigure;
};

export const projects: Project[] = [
  {
    id: 'SNK',
    managerId: 0,
    walletRange: { startId: 2, endId: 502 },
    provider: new JsonRpcProvider(config.JSON_RPC_MAINNET),
    tradeConfig: {
      CHAIN_ID: 56,

      USDT_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
      USDT_DECIMALS: 18,
      TOKEN_ADDRESS: '0x34980c35353A8D7B1A1BA02e02E387a8383e004A',
      TOKEN_DECIMALS: 18,

      BANK_ADDRESS: '0x7D89F5A712Fcc3968DbBAAF7a0c92e426e170C77',
      BOT_MANAGER: '0x9e2987ddC843760985bc5157121feF8c34dAEF99',

      dex: Dex.Uniswap,
      dexVersion: DexVersion.V3,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: '0x6948D6C8532C6B0006CB67c6fB9c399792c8AC91',
      POOL_FEE: FeeAmount.LOWEST,
    },
    AmountTypes: config.PROD
      ? {
          big: {
            id: 0,
            percent: 100,
            data: [300, 1000],
          },
        }
      : {
          small: {
            id: 0,
            percent: 100,
            data: [2, 2],
          },
        },
  },
  {
    id: 'LION',
    managerId: 505,
    walletRange: { startId: 510, endId: 1010 },

    provider: new JsonRpcProvider(config.JSON_RPC_MAINNET),
    tradeConfig: {
      CHAIN_ID: 56,

      USDT_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
      USDT_DECIMALS: 18,
      TOKEN_ADDRESS: '0x8B0Ce9C8797c393eFEef48791960EE3D7297bAc6',
      TOKEN_DECIMALS: 18,

      BANK_ADDRESS: '0x1b6d67Daf777eb0E0905B33B24685bc9895229d4',
      BOT_MANAGER: '0xcA4C9548e7E8e0043E992d4B00965e07BCcd8B69',

      dex: Dex.Pancake,
      dexVersion: DexVersion.V2,

      FACTORY_ADDRESS: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      PAIR_ADDRESS: '0xA921804330947ac2F574A08E202d3CfD29ff369e',
    },
    AmountTypes: config.PROD
      ? {
          big: {
            id: 0,
            percent: 100,
            data: [2, 2],
          },
        }
      : {
          small: {
            id: 0,
            percent: 100,
            data: [2, 2],
          },
        },
  },
  // {
  //   // TEST PRICE ONLY
  //   id: '1INCH',
  //   managerId: 505,
  //   walletRange: { startId: 510, endId: 1010 },

  //   provider: new JsonRpcProvider(config.JSON_RPC_MAINNET),
  //   tradeConfig: {
  //     CHAIN_ID: 56,

  //     USDT_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
  //     USDT_DECIMALS: 18,
  //     TOKEN_ADDRESS: '0x111111111117dC0aa78b770fA6A738034120C302',
  //     TOKEN_DECIMALS: 18,

  //     BANK_ADDRESS: '0x1b6d67Daf777eb0E0905B33B24685bc9895229d4',
  //     BOT_MANAGER: '0xcA4C9548e7E8e0043E992d4B00965e07BCcd8B69',

  //     dex: Dex.Uniswap,
  //     dexVersion: DexVersion.V2,

  //     FACTORY_ADDRESS: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  //     PAIR_ADDRESS: '0x9AB6dD8D91e5F518aF51c83494F21d8A127fc081',
  //   },
  // },
];
