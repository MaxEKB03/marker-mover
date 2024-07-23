import { Injectable, Logger } from '@nestjs/common';
import {
  ethers,
  Transaction,
  TransactionRequest,
  TransactionResponse,
} from 'ethers';
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
import { deflate } from 'zlib';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { TRADE_CONFIG } from 'src/config/trade.config';

@Injectable()
export class VolumeService {
  logger: Logger = new Logger('Volume');

  isRunning: Boolean = false;

  walletId: number = walletRange.startId; // current executer by order

  constructor(
    private readonly randomService: RandomService,
    private readonly uniswapService: UniswapService,
  ) {
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
      `Next executer ${this.walletId}/${walletRange.endId} is: ${executer.address}`,
    );

    await this.increaseBalance();
    const botManager = this.uniswapService.botManager.connect(executer);

    const txType = this.randomService.ofConfigured(TxTypes);
    const amountType = this.randomService.ofConfigured(AmountTypes);
    const [min, max] = amountType.data;

    const isSelling = txType.id == 0;
    const decimalsOut = isSelling
      ? TRADE_CONFIG.USDT_DECIMALS
      : TRADE_CONFIG.TOKEN_DECIMALS;
    const decimalsIn = isSelling
      ? TRADE_CONFIG.TOKEN_DECIMALS
      : TRADE_CONFIG.USDT_DECIMALS;
    const tradeAmount = this.randomService.general(min, max);

    const slippageAmount = isSelling ? tradeAmount : tradeAmount;
    const methodName = isSelling ? 'sell' : 'buy';
    const txMethod = isSelling ? botManager['sell'] : botManager['buy'];

    const amountOut = ethers.parseUnits(tradeAmount.toString(), decimalsOut);
    const amountIn = ethers.parseUnits(slippageAmount.toString(), decimalsIn);

    this.logger.log(
      `Executing ${methodName} with ${amountOut} and ${amountIn}`,
    );

    const tx: TransactionResponse = await txMethod(amountOut, amountIn);
    const response = await tx.wait();
    console.log(response);

    // TODO: add select of compute slippage
    this.incrementWalletId();
  }

  private async increaseBalance() {
    const manager = this.getManager();
    const executer = this.getExecuter();

    const managerBalance = await provider.getBalance(manager.address);
    const executerBalance = await provider.getBalance(executer.address);

    if (managerBalance < transferAmount) {
      this.isRunning = false;
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

  private incrementWalletId() {
    const { startId, endId } = walletRange;
    const addOne = this.walletId + 1;

    this.walletId = addOne < endId ? addOne : startId;
  }
}
