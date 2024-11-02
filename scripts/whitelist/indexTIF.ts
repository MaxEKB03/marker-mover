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
  const wallet = getWalletById(1015);
  const runner = wallet.connect(provider);

  const whitelist = new Contract(
    '0x8dB3c23DA27E15fF3CA534587DA67d3f38F48e8a',
    Whitelist__factory.abi,
    runner,
  );

  const isWhitelist = await whitelist.isWhitelist(getWalletById(1020).address);

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(1020, 1520).map((wallet) => wallet.address),
    );
  }
}

deploy();
