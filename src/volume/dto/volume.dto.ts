import { ethers } from 'ethers';
import config from 'src/config/base.config';

export const slippage = 0.5;

export const minBalance: bigint = ethers.parseEther('0.0002');
export const transferAmount: bigint = ethers.parseEther('0.001');

export const walletRange: { startId: number; endId: number } = {
  startId: 2,
  endId: 502,
};

export type WalletRange = { startId: number; endId: number };

export type RandomElement = {
  id: number;
  percent: number;
  data?: any;
};
export type RandomConfigure = {
  [name: string]: RandomElement;
};

export const minTimeWaiting = 10 * 60;

export const TxTypes: RandomConfigure = {
  sell: {
    id: 0,
    percent: 25,
  },
  buy: {
    id: 1,
    percent: 75,
  },
};

export const AmountTypes: RandomConfigure = config.PROD
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
    };

export enum Events {
  NextIteration = 'NextIteration',
  Start = 'Start',
  Stop = 'Stop',
}
