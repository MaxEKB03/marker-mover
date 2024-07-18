import { HDNodeWallet } from 'ethers';
import { provider } from './provider';
import config from '../src/config/base.config';

export function getWalletById(id: number): HDNodeWallet {
  const path = "m/44'/60'/0'/0/" + id;
  const wallet = HDNodeWallet.fromPhrase(config.MNEMONIC, '', path);
  wallet.connect(provider);
  return wallet;
}

export function getWalletsByRange(
  startId: number,
  endId: number,
): HDNodeWallet[] {
  const wallets = [];
  for (let id = startId; id < endId; id++) {
    const wallet = getWalletById(id);
    wallets.push(wallet);
  }
  return wallets;
}
