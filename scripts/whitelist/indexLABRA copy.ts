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
  console.log(tx);

  await tx.wait();
  console.log('finish tx', tx.hash);
};

const manager = 2038;
const whitelistAddr = '0xce8455295fFd9dEf7174EFf2a569123769A3dcCe';
const startId = 5001;
const endId = 5500;

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
