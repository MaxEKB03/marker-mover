import { ethers } from 'ethers';

export const slippage = 0.5;

export const minBalance: bigint = ethers.parseEther('0.001');
export const transferAmount: bigint = ethers.parseEther('0.004');

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
    data: [2, 10],
  },
  medium: {
    id: 1,
    percent: 35,
    data: [10, 100],
  },
  big: {
    id: 2,
    percent: 15,
    data: [100, 500],
  },
  // massive: {
  //   id: 3,
  //   percent: 5,
  //   data: [1000, 10000],
  // },
};