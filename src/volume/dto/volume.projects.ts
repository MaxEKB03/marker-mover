import { WalletRange } from './volume.dto';
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

      FACTORY_ADDRESS: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
      POOL_ADDRESS: '0x6948D6C8532C6B0006CB67c6fB9c399792c8AC91',
      POOL_FEE: FeeAmount.LOWEST,

      amountTypes: config.PROD
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

      sellMethod: 'sell',
      buyMethod: 'buy',
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

      amountTypes: config.PROD
        ? {
            big: {
              id: 0,
              percent: 100,
              data: [100, 400],
            },
          }
        : {
            small: {
              id: 0,
              percent: 100,
              data: [2, 2],
            },
          },

      sellMethod: 'sellV2',
      buyMethod: 'buyV2',
    },
  },
  {
    id: 'TIF',
    managerId: 1015,
    walletRange: { startId: 1020, endId: 1520 },

    provider: new JsonRpcProvider(config.JSON_RPC_MAINNET),
    tradeConfig: {
      CHAIN_ID: 56,

      USDT_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
      USDT_DECIMALS: 18,
      TOKEN_ADDRESS: '0xFd435840Ed3A4ea061eA3a4cB3C8617823ee2049',
      TOKEN_DECIMALS: 18,

      BANK_ADDRESS: '0x61dbD83E4189587c6e4bef6057fa8Ac1ED77921A',
      BOT_MANAGER: '0x9E01ee02182EF7b2698A59879967c94558C3F6da',

      dex: Dex.Pancake,
      dexVersion: DexVersion.V3,

      FACTORY_ADDRESS: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      POOL_ADDRESS: '0x7B4373293620547e41e0E48711CF9318A8bDe142',
      POOL_FEE: FeeAmount.LOWEST,

      amountTypes: config.PROD
        ? {
            big: {
              id: 0,
              percent: 100,
              data: [20, 100],
            },
          }
        : {
            small: {
              id: 0,
              percent: 100,
              data: [2, 2],
            },
          },

      sellMethod: 'sellV3',
      buyMethod: 'buyV3',
    },
  },
  // {
  //   // TEST PRICE ONLY
  //   id: 'TEST',
  //   managerId: 505,
  //   walletRange: { startId: 510, endId: 1010 },

  //   provider: new JsonRpcProvider(config.JSON_RPC_MAINNET),
  //   tradeConfig: {
  //     CHAIN_ID: 56,

  //     USDT_ADDRESS: '0x55d398326f99059fF775485246999027B3197955',
  //     USDT_DECIMALS: 18,
  //     TOKEN_ADDRESS: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
  //     TOKEN_DECIMALS: 18,

  //     BANK_ADDRESS: '0x1b6d67Daf777eb0E0905B33B24685bc9895229d4',
  //     BOT_MANAGER: '0xcA4C9548e7E8e0043E992d4B00965e07BCcd8B69',

  //     dex: Dex.Pancake,
  //     dexVersion: DexVersion.V3,

  //     FACTORY_ADDRESS: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  //     POOL_ADDRESS: '0x46Cf1cF8c69595804ba91dFdd8d6b960c9B0a7C4',
  //     POOL_FEE: FeeAmount.LOWEST,

  //     amountTypes: config.PROD
  //       ? {
  //           big: {
  //             id: 0,
  //             percent: 100,
  //             data: [100, 400],
  //           },
  //         }
  //       : {
  //           small: {
  //             id: 0,
  //             percent: 100,
  //             data: [2, 2],
  //           },
  //         },
  //   },
  // },
];
