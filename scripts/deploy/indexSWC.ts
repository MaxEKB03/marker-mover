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
  const wallet = getWalletById(2600);
  const runner = wallet.connect(provider);

  const whitelist = new Contract(
    '0x63377BcA84b2beDdc848cf98524B14250b382840',
    Whitelist__factory.abi,
    runner,
  );

  const isWhitelist = await whitelist.isWhitelist(getWalletById(2601).address);

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(2601, 3101).map((wallet) => wallet.address),
    );
  }
}

deploy();
