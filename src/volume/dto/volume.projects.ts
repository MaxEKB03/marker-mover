import { WalletRange } from './volume.dto';
import { JsonRpcProvider, Provider } from 'ethers';
import { TradeConfig } from 'src/config/trade.config';
import { FeeAmount } from '@uniswap/v3-sdk';
import config from 'src/config/base.config';

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

      BOT_MANAGER: '0x9e2987ddC843760985bc5157121feF8c34dAEF99',

      dex: Dex.Uniswap,
      dexVersion: DexVersion.V3,

      FACTORY_ADDRESS: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      POOL_ADDRESS: '0x6948D6C8532C6B0006CB67c6fB9c399792c8AC91',
      POOL_FEE: FeeAmount.LOWEST,
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
      TOKEN_ADDRESS: '0x34980c35353A8D7B1A1BA02e02E387a8383e004A',
      TOKEN_DECIMALS: 18,

      BOT_MANAGER: '0x9e2987ddC843760985bc5157121feF8c34dAEF99',

      dex: Dex.Pancake,
      dexVersion: DexVersion.V2,
    },
  },
];
