import { Logger } from '@nestjs/common';
import { ControlsSlot } from './controls/controls.slot';
import { ControlsService } from './controls/controls.service';
import { getWalletById } from 'scripts/addressFactory';
import { Provider } from 'ethers';
import { minBalance, transferAmount } from './dto/volume.dto';
import { EventEmitter } from 'stream';

export abstract class VolumeBase {
  storage = this.controlsService.slots[this.id];
  protected logger = new Logger('Volume-' + this.id);

  constructor(
    protected readonly id: string,
    protected readonly controlsService: ControlsService,
    protected readonly provider: Provider,
  ) {}

  protected getManager() {
    return getWalletById(this.storage.managerId).connect(this.provider);
  }

  protected getExecuter() {
    return getWalletById(this.storage.walletId).connect(this.provider);
  }

  protected async increaseBalance() {
    const manager = this.getManager();
    const executer = this.getExecuter();

    const managerBalance = await this.provider.getBalance(manager.address);
    const executerBalance = await this.provider.getBalance(executer.address);

    if (managerBalance < transferAmount) {
      this.storage.isRunning = false;
      throw new Error('Manager balance is so low');
    }

    if (executerBalance < minBalance) {
      const { gasPrice } = await this.provider.getFeeData();
      const nonce = await manager.getNonce();
      const txParams = {
        from: manager.address, // sender wallet address
        to: executer.address, // receiver address
        data: '0x',
        value: transferAmount,
        gasLimit: 21000,
        gasPrice,
        nonce,
      };
      const tx = await manager.sendTransaction(txParams);
      await tx.wait();
    }
  }
}
