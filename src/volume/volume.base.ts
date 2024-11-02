import { Logger } from '@nestjs/common';
import { ControlsService } from './controls/controls.service';
import { getWalletById } from 'scripts/addressFactory';
import { Provider } from 'ethers';
import {
  Events,
  minBalanceArbitrum,
  minBalanceMainnet,
  transferAmountArbitrum,
  transferAmountMainnet,
} from './dto/volume.dto';
import { TelegramService } from 'src/telegram/telegram.service';
import config from 'src/config/base.config';

export abstract class VolumeBase {
  storage = this.controlsService.slots[this.id];
  protected logger = new Logger('Volume-' + this.id);

  constructor(
    protected readonly id: string,
    protected readonly controlsService: ControlsService,
    protected readonly provider: Provider,
    protected readonly telegramService: TelegramService,
  ) {
    this.storage.eventEmitter.addListener(Events.Start, () => {
      this.start();
    });
    this.storage.eventEmitter.addListener(Events.Stop, () => {
      this.stop();
    });
  }

  protected start() {
    this.logger.log('start');
    this.storage.eventEmitter.emit(Events.NextIteration);
    this.telegramService.notifyAdmin('Farm was started', this.id);
  }

  protected stop() {
    this.logger.log('stop');
    this.telegramService.notifyAdmin('Farm was stopped', this.id);
  }

  protected getManager() {
    return getWalletById(this.storage.managerId).connect(this.provider);
  }

  protected getExecuter() {
    return getWalletById(this.storage.walletId).connect(this.provider);
  }

  protected async increaseBalance() {
    const manager = this.getManager();
    const executer = this.getExecuter();

    const minBalance =
      config.DEFAULT_NETWORK === 'mainnet'
        ? minBalanceMainnet
        : minBalanceArbitrum;

    const transferAmount =
      config.DEFAULT_NETWORK === 'mainnet'
        ? transferAmountMainnet
        : transferAmountArbitrum;

    const network = config.DEFAULT_NETWORK === 'mainnet';

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
        gasLimit: 50000,
        gasPrice,
        nonce,
      };

      const tx = await manager.sendTransaction(txParams);
      await tx.wait();
    }
  }
}
