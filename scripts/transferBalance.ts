import { getWalletsByRange } from './addressFactory';
import { provider } from './provider';
import { TransactionRequest } from 'ethers';

const target = '0x7f8E8336CD9cdbA582F458b53e224B5040A9e147';

async function main() {
  const wallets = getWalletsByRange(2601, 3101);
  const signs: string[] = [];
  const { gasPrice } = await provider.getFeeData();

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i].connect(provider);
    const balance: bigint = await provider.getBalance(wallet.address);

    if (balance > 600000000000000n) {
      console.log(i, true);

      // transfer
      const gasLimit = 21000n;
      const gasAmount = gasLimit * gasPrice;
      const transferAmount = balance - gasAmount;

      const nonce = await wallet.getNonce();
      const txParams: TransactionRequest = {
        from: wallet.address, // sender wallet address
        to: target, // receiver address
        data: '0x',
        value: transferAmount,
        gasLimit,
        gasPrice,
        nonce,
        chainId: 56,
      };

      const sign = await wallet.signTransaction(txParams);
      signs.push(sign);
      // const tx = await wallet.sendTransaction(txParams);
      // const response = await tx.wait();
      // console.log(response.hash);
    } else {
      console.log(i, false, wallet.address, balance);
    }
  }
  console.log('Broadcast signs');

  const promises = signs.map((sign) => provider.broadcastTransaction(sign));
  const responses = await Promise.all(promises);
  const hashes = responses.map((res) => res.hash);
  console.log(hashes);
}

main();
