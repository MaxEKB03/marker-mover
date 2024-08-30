import { WalletRange } from './volume.dto';

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
  dex: Dex;
  dexVersion: DexVersion;
};

export const projects: Project[] = [
  {
    id: 'SNK',
    managerId: 1,
    walletRange: { startId: 2, endId: 502 },
    dex: Dex.Uniswap,
    dexVersion: DexVersion.V3,
  },
  {
    id: 'LION',
    managerId: 505,
    walletRange: { startId: 510, endId: 1010 },
    dex: Dex.Pancake,
    dexVersion: DexVersion.V2,
  },
];
