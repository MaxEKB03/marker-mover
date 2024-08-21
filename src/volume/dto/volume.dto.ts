import { ethers } from 'ethers';

export const slippage = 0.5;

export const minBalance: bigint = ethers.parseEther('0.0002');
export const transferAmount: bigint = ethers.parseEther('0.001');

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

export const AmountTypes: RandomConfigure = {
  small: {
    id: 0,
    // percent: 100,
    percent: 0,
    data: [2, 2],
  },
  medium: {
    id: 1,
    // percent: 35,
    percent: 0,
    data: [70, 130],
  },
  big: {
    id: 2,
    // percent: 15,
    percent: 100,
    data: [300, 1000],
  },
  // massive: {
  //   id: 3,
  //   percent: 5,
  //   data: [1000, 10000],
  // },
};
