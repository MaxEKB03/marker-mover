import { dictionary } from '../../ignition/dictionary';
import { deployManager } from './manager';
import { deployTokens } from './tokens';
import { getWalletById, getWalletsByRange } from '../addressFactory';
import { BaseContractMethod, ContractTransactionResponse } from 'ethers';
import { deployWhitelist } from './whitelist';

const waitTx = async (callMethod: BaseContractMethod, ...args) => {
  const tx: ContractTransactionResponse = await callMethod(...args);
  await tx.wait();
  console.log('finish tx', tx.hash);
};

export async function deploy() {
  /////////////////////////////////////////////////////
  const { buyToken, sellToken } = await deployTokens();

  dictionary.addresses['buyToken'] = await buyToken.getAddress();
  dictionary.addresses['sellToken'] = await sellToken.getAddress();

  // TODO: create pool

  /////////////////////////////////////////////////////
  const { whitelist } = await deployWhitelist();

  dictionary.addresses['whitelist'] = await whitelist.getAddress();

  const isWhitelist = await whitelist.isWhitelist(getWalletById(2));

  if (!isWhitelist) {
    await waitTx(
      whitelist.grant,
      getWalletsByRange(2, 502).map((wallet) => wallet.address),
    );
  }

  /////////////////////////////////////////////////////
  const { botManager } = await deployManager();
  const botManagerAddress = await botManager.getAddress();

  dictionary.addresses['botManager'] = botManagerAddress;

  const owner = getWalletById(0).address;

  const balance0 = await buyToken.balanceOf(owner);
  await waitTx(buyToken.approve, botManagerAddress, balance0);
  const allowance0 = await buyToken.allowance(owner, botManagerAddress);
  if (balance0 != allowance0) throw new Error('allowance0 is Invalid');

  const balance1 = await sellToken.balanceOf(owner);
  await waitTx(sellToken.approve, botManagerAddress, balance1);
  const allowance1 = await sellToken.allowance(owner, botManagerAddress);
  if (balance1 != allowance1) throw new Error('allowance1 is Invalid');

  console.log('Success');
  console.log(dictionary.addresses);
}
