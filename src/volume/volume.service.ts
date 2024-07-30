import { Injectable, Logger } from '@nestjs/common';
import { ethers, TransactionResponse } from 'ethers';
import { getWalletById } from 'scripts/addressFactory';
import { provider } from 'scripts/provider';
import { wait } from 'src/helpers/time';
import { RandomService } from 'src/random/random.service';
import {
  AmountTypes,
  minBalance,
  transferAmount,
  TxTypes,
  walletRange,
} from './dto/volume.dto';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { TRADE_CONFIG } from 'src/config/trade.config';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class VolumeService {
  logger: Logger = new Logger('Volume');

  walletId: number = walletRange.startId; // current executer by order

  constructor(
    private readonly randomService: RandomService,
    private readonly uniswapService: UniswapService,
    private readonly controlsService: ControlsService,
    protected readonly telegramService: TelegramService,
  ) {
    this.getManager();
    this.listen();
  }

  private getManager() {
    return getWalletById(0).connect(provider);
  }

  private getExecuter() {
    return getWalletById(this.walletId).connect(provider);
  }

  private async listen() {
    while (true) {
      await wait(10);
      this.logger.log('Next iteration');

      if (!this.controlsService.isRunning) {
        continue;
      }

      try {
        await this.process();
      } catch (e) {
        console.log(e);
        this.controlsService.isRunning = false;

        const errorMessage = e.toString();
        await this.telegramService.notify(errorMessage.slice(0, 250));
      }
    }
  }

  private async process() {
    const executer = this.getExecuter();
    this.logger.log(
      `Next executer ${this.walletId}/${walletRange.endId} is: ${executer.address}`,
    );

    await this.increaseBalance();

    await this.runTrade();

    await this.waitRandomTime();

    // this.incrementWalletId();
  }

  private async increaseBalance() {
    const manager = this.getManager();
    const executer = this.getExecuter();

    const managerBalance = await provider.getBalance(manager.address);
    const executerBalance = await provider.getBalance(executer.address);

    if (managerBalance < transferAmount) {
      this.controlsService.isRunning = false;
      throw new Error('Manager balance is so low');
    }

    if (executerBalance < minBalance) {
      const { gasPrice } = await provider.getFeeData();
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
      // const signedTx = await manager.signTransaction(tx);
      const tx = await manager.sendTransaction(txParams);
      await tx.wait();
    }
  }

  private async runTrade() {
    const executer = this.getExecuter();

    const botManager = this.uniswapService.botManager.connect(executer);

    const txType = this.randomService.ofConfigured(TxTypes);
    const amountType = this.randomService.ofConfigured(AmountTypes);
    const [min, max] = amountType.data;

    const isSelling = txType.id != 0;
    const decimalsOut = isSelling
      ? TRADE_CONFIG.USDT_DECIMALS
      : TRADE_CONFIG.TOKEN_DECIMALS;
    const decimalsIn = isSelling
      ? TRADE_CONFIG.TOKEN_DECIMALS
      : TRADE_CONFIG.USDT_DECIMALS;
    const tradeAmount = this.randomService.general(min, max);

    const methodName = isSelling ? 'sell' : 'buy';

    const slippageAmountPromise = isSelling
      ? this.uniswapService.getOutputAmount(tradeAmount.toString())
      : this.uniswapService.getInputAmount(tradeAmount.toString());
    const slippageAmount = await slippageAmountPromise;

    const tradeAmountUnited = ethers.parseUnits(
      tradeAmount.toString(),
      decimalsIn,
    );
    const slippageAmountUnited = ethers.parseUnits(
      slippageAmount.toString(),
      decimalsOut,
    );

    this.logger.log(
      `Executing ${methodName}:  ${tradeAmount} > ${slippageAmount}`,
    );
    console.log(tradeAmountUnited, slippageAmountUnited);

    if (tradeAmountUnited === 0n || slippageAmountUnited === 0n) {
      return;
    }

    const txMethod = isSelling
      ? botManager['sell'](slippageAmountUnited, tradeAmountUnited)
      : botManager['buy'](tradeAmountUnited, slippageAmountUnited);
    const tx: TransactionResponse = await txMethod;
    const response = await tx.wait();
    console.log(response.hash);
  }

  private async waitRandomTime() {
    const threeMinutes = 180;

    await wait(threeMinutes);
  }

  private incrementWalletId() {
    const { startId, endId } = walletRange;
    const addOne = this.walletId + 1;

    this.walletId = addOne < endId ? addOne : startId;
  }
}
