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
  const wallet = getWalletById(2035);
  const runner = wallet.connect(provider);

  const whitelist = new Contract(
    '0xA3a08DB5901222829A4683EF1AFEC84535De82F9',
    Whitelist__factory.abi,
    runner,
  );

  const isWhitelist = await whitelist.isWhitelist(getWalletById(1530).address);

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(2045, 2545).map((wallet) => wallet.address),
    );
  }
}

deploy();
