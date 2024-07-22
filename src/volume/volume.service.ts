import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { getWalletById } from 'scripts/addressFactory';
import { provider } from 'scripts/provider';
import { wait } from 'src/helpers/time';
import { RandomService } from 'src/random/random.service';

@Injectable()
export class VolumeService {
  logger: Logger = new Logger('Volume');

  isRunning: Boolean = false;
  walletRange: { startId: number; endId: number } = {
    startId: 2,
    endId: 502,
  };
  walletId: number = this.walletRange.startId; // current executer by order

  minBalance: bigint = ethers.parseEther('0.0005');
  transferAmount: bigint = ethers.parseEther('0.002');

  constructor(private readonly randomService: RandomService) {
    this.getManager();
    this.listen();
    this.isRunning = true;
  }

  private getManager() {
    return getWalletById(1).connect(provider);
  }

  private getExecuter() {
    return getWalletById(this.walletId).connect(provider);
  }

  private async listen() {
    while (true) {
      await wait(10);
      this.logger.log('Next iteration');

      if (!this.isRunning) {
        continue;
      }

      try {
        await this.process();
      } catch (e) {
        console.log(e);
        this.isRunning = false;
      }
    }
  }

  private async process() {
    const executer = this.getExecuter();
    this.logger.log(
      `Next executer ${this.walletId}/${this.walletRange.endId} is: ${executer.address}`,
    );

    await this.increaseBalance();

    this.incrementWalletId();
  }

  private async increaseBalance() {
    const manager = this.getManager();
    const executer = this.getExecuter();

    const managerBalance = await provider.getBalance(manager.address);
    const executerBalance = await provider.getBalance(executer.address);

    if (managerBalance < this.transferAmount) {
      this.isRunning = false;
      throw new Error('Manager balance is so low');
    }

    if (executerBalance < this.minBalance) {
      const { gasPrice } = await provider.getFeeData();
      const nonce = await manager.getNonce();
      const txParams = {
        from: manager.address, // sender wallet address
        to: executer.address, // receiver address
        data: '0x',
        value: this.transferAmount,
        gasLimit: 21000,
        gasPrice,
        nonce,
      };
      // const signedTx = await manager.signTransaction(tx);
      const tx = await manager.sendTransaction(txParams);
      await tx.wait();
    }
  }

  private incrementWalletId() {
    const { startId, endId } = this.walletRange;
    const addOne = this.walletId + 1;

    this.walletId = addOne < endId ? addOne : startId;
  }
}
