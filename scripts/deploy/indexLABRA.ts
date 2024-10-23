import { getWalletById, getWalletsByRange } from '../addressFactory';
import {
  BaseContractMethod,
  Contract,
  ContractTransactionResponse,
} from 'ethers';
import { Whitelist__factory } from '../../typechain-types';
import { provider } from '../provider';

const waitTx = async (callMethod: BaseContractMethod, ...args) => {
  const tx: ContractTransactionResponse = await callMethod(...args);
  await tx.wait();
  console.log('finish tx', tx.hash);
};

const manager = 2036;
const whitelistAddr = '0x9e25448517aa8f694408c6238fb2d12549dd0bdb';
const startId = 4001;
const endId = 4500;

export async function deploy() {
  const wallet = getWalletById(manager);
  const runner = wallet.connect(provider);

  const whitelist = new Contract(whitelistAddr, Whitelist__factory.abi, runner);

  const isWhitelist = await whitelist.isWhitelist(
    getWalletById(startId).address,
  );

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(startId, endId).map((wallet) => wallet.address),
    );
  }
}

deploy();
