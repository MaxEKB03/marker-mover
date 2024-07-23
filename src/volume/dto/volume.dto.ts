import { ethers } from 'ethers';

export const slippage = 0.5;

export const minBalance: bigint = ethers.parseEther('0.0005');
export const transferAmount: bigint = ethers.parseEther('0.002');

export const walletRange: { startId: number; endId: number } = {
  startId: 2,
  endId: 502,
};

export type RandomElement = {
  id: number;
  percent: number;
  data?: any;
};
export type RandomConfigure = {
  [name: string]: RandomElement;
};

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

export const AmountTypes: RandomConfigure = {
  small: {
    id: 0,
    percent: 50,
    data: [1, 10],
  },
  medium: {
    id: 1,
    percent: 25,
    data: [10, 100],
  },
  big: {
    id: 2,
    percent: 20,
    data: [100, 1000],
  },
  massive: {
    id: 3,
    percent: 5,
    data: [1000, 10000],
  },
};
