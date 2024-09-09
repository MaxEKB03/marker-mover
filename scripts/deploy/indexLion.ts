import { getWalletById, getWalletsByRange } from '../addressFactory';
import {
  BaseContractMethod,
  Contract,
  ContractTransactionResponse,
} from 'ethers';
import { Whitelist__factory } from '../../typechain-types';
import { provider } from 'scripts/provider';

const waitTx = async (callMethod: BaseContractMethod, ...args) => {
  const tx: ContractTransactionResponse = await callMethod(...args);
  await tx.wait();
  console.log('finish tx', tx.hash);
};

export async function deploy() {
  const wallet = getWalletById(505);
  const runner = wallet.connect(provider);

  const whitelist = new Contract(
    '0x0bd9B0B9Aa7a7712b0EBE218D107334B5b43006F',
    Whitelist__factory.abi,
    runner,
  );

  const isWhitelist = await whitelist.isWhitelist(getWalletById(510));

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(510, 1010).map((wallet) => wallet.address),
    );
  }
}

deploy();
