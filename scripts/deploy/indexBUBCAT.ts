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

export async function deploy() {
  const wallet = getWalletById(1521);
  const runner = wallet.connect(provider);

  const whitelist = new Contract(
    '0x7d7788bC173969Cb057701DED567E8fEBB48CbA5',
    Whitelist__factory.abi,
    runner,
  );

  const isWhitelist = await whitelist.isWhitelist(getWalletById(1530).address);

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(1530, 2030).map((wallet) => wallet.address),
    );
  }
}

deploy();
