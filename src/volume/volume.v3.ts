import { Logger } from '@nestjs/common';
import { RandomService } from 'src/random/random.service';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { getWalletById } from 'scripts/addressFactory';
import { Provider, TransactionResponse } from 'ethers';
import { wait } from 'src/helpers/time';
import {
  AmountTypes,
  minBalance,
  minTimeWaiting,
  transferAmount,
  TxTypes,
} from './dto/volume.dto';
import { ethers } from 'ethers';
import { TradeConfigV3 } from 'src/config/trade.config';
import { ControlsSlot } from './controls/controls.slot';
import { VolumeBase } from './volume.base';
import { ContractsService } from 'src/contracts/contracts.service';

export class VolumeV3 implements VolumeBase {
  storage: ControlsSlot = this.controlsService.slots[this.id];

  private logger: Logger = new Logger('Volume-' + this.id);

  constructor(
    private readonly id: string,
    private readonly walletRange: { startId: number; endId: number },
    private readonly tradeConfig: TradeConfigV3,
    private readonly provider: Provider,
    private readonly randomService: RandomService,
    private readonly uniswapService: UniswapService,
    private readonly controlsService: ControlsService,
    private readonly contractsService: ContractsService,
    protected readonly telegramService: TelegramService,
  ) {
    this.listen();
    // this.controlsService.isRunning = true;
  }

  private getManager() {
    return getWalletById(this.storage.managerId).connect(this.provider);
  }

  private getExecuter() {
    return getWalletById(this.storage.walletId).connect(this.provider);
  }

  private async listen() {
    this.telegramService.notifyAdmin('Farm is starting', this.id);
    while (true) {
      await wait(10);
      this.logger.log('Next iteration');

      if (!this.storage.isRunning) {
        continue;
      }

      try {
        await this.process();
      } catch (e) {
        console.log(e);
        this.storage.isRunning = false;

        const errorMessage = e.toString();
        await this.telegramService.notifyAdmin(
          errorMessage.slice(0, 250),
          this.id,
        );

        await wait(300);
        this.storage.isRunning = true;
      }
    }
  }

  private async process() {
    const executer = this.getExecuter();
    this.logger.log(
      `Next executer ${this.storage.walletId}/${this.walletRange.endId} is: ${executer.address}`,
    );

    await this.increaseBalance();

    await this.runTrade();

    await this.waitRandomTime();

    this.storage.incrementWalletId();
  }

  private async increaseBalance() {
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

  private async runTrade() {
    const executer = this.getExecuter();

    const botManager = this.contractsService.botManager(
      this.tradeConfig.BOT_MANAGER,
      this.provider,
      executer,
    );

    const txType = this.randomService.ofConfigured(TxTypes);
    const amountType = this.randomService.ofConfigured(AmountTypes);
    const [min, max] = amountType.data;

    const isSellingByRandom = txType.id != 0;

    const usdAmount = this.randomService.general(min, max);

    const bankBalances = await this.getBankBalance();

    const [bankUsdAmount, bankTokenAmount] = bankBalances.map((bigValue) =>
      Math.round(Number(ethers.formatEther(bigValue))),
    );
    const tokenAmount = await this.usdToToken(usdAmount.toString());
    const tokenAmountFormatted = Math.round(
      Number(ethers.formatEther(tokenAmount)),
    );
    let tradeAmountUnited = isSellingByRandom
      ? usdAmount
      : Math.round(Number(ethers.formatEther(tokenAmount)));

    const compareValue = isSellingByRandom ? bankUsdAmount : bankTokenAmount;

    const isPossible = tradeAmountUnited * 1.2 < compareValue;

    tradeAmountUnited = !isPossible
      ? !isSellingByRandom
        ? usdAmount
        : tokenAmountFormatted
      : tradeAmountUnited;

    let message = `\n${this.storage.walletId}/${this.walletRange.endId}|${executer.address}\n`;
    const isSelling = isPossible ? isSellingByRandom : !isSellingByRandom; // Check balance to trade, else change direction
    if (!isPossible) {
      message += 'Direction was changed, cause balance of bank is low\n';
    }

    const decimalsOut = isSelling
      ? this.tradeConfig.USDT_DECIMALS
      : this.tradeConfig.TOKEN_DECIMALS;
    const decimalsIn = isSelling
      ? this.tradeConfig.TOKEN_DECIMALS
      : this.tradeConfig.USDT_DECIMALS;

    const methodName = isSelling ? 'sell' : 'buy';

    const tradeAmount = ethers.parseUnits(
      tradeAmountUnited.toString(),
      decimalsIn,
    );

    const getExactAmount = isSelling
      ? this.uniswapService.getOutputAmountReversed(
          this.tradeConfig,
          Number(tradeAmount),
        )
      : this.uniswapService.getOutputAmount(
          this.tradeConfig,
          Number(tradeAmount),
        );
    const exactAmount = await getExactAmount;

    const slippageAmount = isSelling
      ? BigInt(exactAmount.quoteAmount)
      : BigInt(exactAmount.subAmount);

    const slippageAmountUnited = ethers.formatUnits(
      slippageAmount.toString(),
      decimalsOut,
    );

    message += `Executing ${methodName}: ${tradeAmountUnited} > ${slippageAmountUnited}`;
    this.logger.log(message);
    this.logger.log(
      `tradeAmount: ${tradeAmount}, slippageAmount: ${slippageAmount}`,
    );

    if (tradeAmount === 0n || slippageAmount === 0n) {
      return;
    }

    const txMethod = isSelling
      ? botManager['sell'](slippageAmount, tradeAmount)
      : botManager['buy'](tradeAmount, slippageAmount);
    const tx: TransactionResponse = await txMethod;
    const response = await tx.wait();
    this.logger.log(`response.hash: ${response.hash}`);
    message += `\n\nhttps://bscscan.com/tx/${response.hash}`;

    this.telegramService.notify(message, this.id);
  }

  private async waitRandomTime() {
    const randomMin = minTimeWaiting * 0.2;
    const randomMax = minTimeWaiting * 0.35;
    const randomEnd = this.randomService.general(randomMin, randomMax);
    const awaitTime = minTimeWaiting + randomEnd;

    this.logger.log(
      `Next tx will run after ${(awaitTime / 60).toFixed(2)} minutes`,
    );
    await wait(awaitTime);
  }

  async usdToToken(usdInDecimal: string) {
    const usdAmount = Number(ethers.parseEther(usdInDecimal));
    const token0: string = await this.contractsService
      .pool(this.tradeConfig.POOL_ADDRESS, this.provider)
      .token0();
    const isFirst =
      token0.toLowerCase() === this.tradeConfig.TOKEN_ADDRESS.toLowerCase();

    const promise = isFirst
      ? this.uniswapService.getOutputAmountReversed(this.tradeConfig, usdAmount)
      : this.uniswapService.getOutputAmount(this.tradeConfig, usdAmount);

    const { quoteAmount: inToken } = await promise;

    return BigInt(inToken);
  }

  async tokenToUSD(tokenBalance: number) {
    const token0: string = await this.contractsService
      .pool(this.tradeConfig.POOL_ADDRESS, this.provider)
      .token0();
    const isFirst =
      token0.toLowerCase() === this.tradeConfig.TOKEN_ADDRESS.toLowerCase();

    const promise = isFirst
      ? this.uniswapService.getOutputAmount(this.tradeConfig, tokenBalance)
      : this.uniswapService.getOutputAmountReversed(
          this.tradeConfig,
          tokenBalance,
        );

    const { quoteAmount: inUsd } = await promise;

    return BigInt(inUsd);
  }

  async getBankBalance() {
    const bankAddress = '0x7D89F5A712Fcc3968DbBAAF7a0c92e426e170C77';

    const usdtContract = this.contractsService.token(
      this.tradeConfig.USDT_ADDRESS,
      this.provider,
    );
    const tokenContract = this.contractsService.token(
      this.tradeConfig.USDT_ADDRESS,
      this.provider,
    );

    const usdtBalance: bigint = await usdtContract.balanceOf(bankAddress);
    const tokenBalance: bigint = await tokenContract.balanceOf(bankAddress);
    const tokenInUSD = await this.tokenToUSD(Number(tokenBalance));

    return [usdtBalance, tokenBalance, tokenInUSD];
  }
}
