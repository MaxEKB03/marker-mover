import { RandomService } from 'src/random/random.service';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { Provider, TransactionResponse } from 'ethers';
import { wait } from 'src/helpers/time';
import { AmountTypes, Events, minTimeWaiting, TxTypes } from './dto/volume.dto';
import { ethers } from 'ethers';
import { VolumeBase } from './volume.base';
import { ContractsService } from 'src/contracts/contracts.service';
import { TradeConfigV2 } from 'src/config/trade.config';
import { UniswapServiceV2 } from 'src/uniswap/uniswap.serviceV2';
import { PancakeServiceV2 } from 'src/uniswap/pancake.serviceV2';
import { Dex } from './dto/volume.projects';

type Void = () => void;

export class VolumeV2 extends VolumeBase {
  constructor(
    id: string,
    controlsService: ControlsService,
    provider: Provider,
    telegramService: TelegramService,
    protected readonly randomService: RandomService,
    protected readonly walletRange: { startId: number; endId: number },
    protected readonly tradeConfig: TradeConfigV2,
    protected readonly contractsService: ContractsService,
    protected readonly uniswapServiceV2: UniswapServiceV2,
    protected readonly pancakeServiceV2: PancakeServiceV2,
  ) {
    super(id, controlsService, provider, telegramService);
    this.listen();
  }

  cancelFunctions: { [id: number]: () => void } = {};

  private async listen() {
    let idCounter = 0;
    this.storage.eventEmitter.on(Events.Stop, () => {
      // const cancelFunctions = Object.values(this.cancelFunctions);
      // for (let id = 0; id < cancelFunctions.length; id++) {
      //   const cancelFn = cancelFunctions[id];
      //   cancelFn();
      //   delete cancelFunctions[id];
      // }
      throw new Error(`stoped ${new Date()}`);
    });

    this.storage.eventEmitter.on(Events.NextIteration, async () => {
      this.logger.log('Next iteration');
      try {
        idCounter++;
        await this.process(idCounter);
      } catch (e) {
        console.log(e);

        const errorMessage = e.toString();
        await this.telegramService.notifyAdmin(
          errorMessage.slice(0, 250),
          this.id,
        );

        await wait(300);
        this.storage.eventEmitter.emit(Events.NextIteration);
      }
    });
  }

  private async process(id: number) {
    // return new Promise<void>(async (resolve, reject) => {
    //   const cancelFn = () => {
    //     reject(new Error(`Task was cancelled`));
    //   };

    //   this.cancelFunctions[id] = cancelFn;
    // delete this.cancelFunctions[id];

    // });
    this.storage.computeNextWalletId();
    const executer = this.getExecuter();
    this.logger.log(
      `Next executer ${this.storage.walletId}/${this.walletRange.endId} is: ${executer.address}`,
    );
    await this.increaseBalance();
    await this.runTrade();
    await this.waitRandomTime();
    this.storage.eventEmitter.emit(Events.NextIteration);
  }

  private async runTrade() {
    const executer = this.getExecuter();
    const botManager = this.contractsService.botManager(
      this.tradeConfig.BOT_MANAGER,
      this.provider,
      executer,
    );
    const txType = this.randomService.ofConfigured(TxTypes);
    const amountType = this.randomService.ofConfigured(
      this.tradeConfig.amountTypes,
    );
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
    const dexService =
      this.tradeConfig.dex === Dex.Uniswap
        ? 'uniswapServiceV2'
        : 'pancakeServiceV2';

    const getExactAmount = isSelling
      ? this[dexService].getOutputAmountReversed(
          this.tradeConfig,
          Number(tradeAmount),
        )
      : this[dexService].getOutputAmount(this.tradeConfig, Number(tradeAmount));

    const exactAmount = await getExactAmount;
    let slippageAmount;
    const round = (n: number) => {
      const rounBy = 10;
      let nBig = BigInt(n);
      let nStr = nBig.toString();
      if (nStr.length < rounBy + 1) {
        throw new Error('input is so low');
      }
      nStr = nStr.slice(0, nStr.length - rounBy);
      nStr = nStr.concat('0'.repeat(rounBy));
      // console.log('rounding', n, BigInt(nStr));
      return BigInt(nStr);
    };
    if (this.tradeConfig.dex === Dex.Uniswap) {
      slippageAmount = isSelling
        ? round(exactAmount.quoteAmount)
        : round(exactAmount.subAmount);
    } else {
      slippageAmount = round(exactAmount.quoteAmount);
    }
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
      ? botManager['buyV2'](BigInt(tradeAmount), BigInt(slippageAmount))
      : botManager['sellV2'](BigInt(tradeAmount), BigInt(slippageAmount));

    const tx: TransactionResponse = await txMethod;
    const response = await tx.wait();
    this.logger.log(`response.hash: ${response.hash}`);
    message += `\n\nhttps://bscscan.com/tx/${response.hash}`;
    await this.telegramService.notify(message, this.id);
  }

  private async waitRandomTime() {
    const randomMin = minTimeWaiting * 0.2;
    const randomMax = minTimeWaiting * 0.35;
    const randomEnd = this.randomService.general(randomMin, randomMax);
    let awaitTime = minTimeWaiting + randomEnd;

    if (this.tradeConfig.txsInHours) {
      const k = (60 * 60) / this.tradeConfig.txsInHours;
      const randomMin = k - k * 0.1;
      const randomMax = k + k * 0.1;
      const randomEnd = this.randomService.general(randomMin, randomMax);
      awaitTime = minTimeWaiting + randomEnd;
    }

    this.logger.log(
      `Next tx will run after ${(awaitTime / 60).toFixed(2)} minutes`,
    );
    await wait(awaitTime);
  }

  async usdToToken(usdInDecimal: string) {
    const usdAmount = Number(ethers.parseEther(usdInDecimal));
    const promiseGetOutputAmountReversed =
      this.tradeConfig.dex === Dex.Uniswap
        ? this.uniswapServiceV2.getOutputAmountReversed(
            this.tradeConfig,
            usdAmount,
          )
        : this.pancakeServiceV2.getOutputAmountReversed(
            this.tradeConfig,
            usdAmount,
          );

    const { quoteAmount: inUsd } = await promiseGetOutputAmountReversed;
    return BigInt(inUsd);
  }

  async tokenToUSD(tokenBalance: number) {
    const promiseGetOutputAmount =
      this.tradeConfig.dex === Dex.Uniswap
        ? this.uniswapServiceV2.getOutputAmount(this.tradeConfig, tokenBalance)
        : this.pancakeServiceV2.getOutputAmount(this.tradeConfig, tokenBalance);

    const { quoteAmount: inUsd } = await promiseGetOutputAmount;
    return BigInt(inUsd);
  }

  async getBankBalance() {
    const usdtContract = this.contractsService.token(
      this.tradeConfig.USDT_ADDRESS,
      this.provider,
    );
    const tokenContract = this.contractsService.token(
      this.tradeConfig.TOKEN_ADDRESS,
      this.provider,
    );
    const usdtBalance: bigint = await usdtContract.balanceOf(
      this.tradeConfig.BANK_ADDRESS,
    );
    const tokenBalance: bigint = await tokenContract.balanceOf(
      this.tradeConfig.BANK_ADDRESS,
    );
    // const usdtBalance = ethers.parseEther('100');
    // const tokenBalance = ethers.parseEther('100');
    const tokenInUSD = await this.tokenToUSD(Number(tokenBalance));

    return [usdtBalance, tokenBalance, tokenInUSD];
  }
}
