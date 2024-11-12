import { RandomService } from 'src/random/random.service';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { Provider, TransactionLike, TransactionResponse } from 'ethers';
import { wait } from 'src/helpers/time';
import { AmountTypes, Events, minTimeWaiting, TxTypes } from './dto/volume.dto';
import { ethers } from 'ethers';
import { TradeConfigV3 } from 'src/config/trade.config';
import { VolumeBase } from './volume.base';
import { ContractsService } from 'src/contracts/contracts.service';
import { PancakeService } from 'src/uniswap/pancake.service';
import { Dex } from './dto/volume.projects';

export class VolumeV3 extends VolumeBase {
  constructor(
    id: string,
    controlsService: ControlsService,
    provider: Provider,
    telegramService: TelegramService,
    protected readonly randomService: RandomService,
    protected readonly walletRange: { startId: number; endId: number },
    protected readonly tradeConfig: TradeConfigV3,
    protected readonly contractsService: ContractsService,
    protected readonly uniswapService: UniswapService,
    protected readonly pancakeService: PancakeService,
  ) {
    super(id, controlsService, provider, telegramService);
    this.listen();
    this.storage.eventEmitter.emit(Events.Start);
  }

  cancelFunctions: { [id: number]: () => void } = {};

  private async listen() {
    let idCounter = 0;
    this.storage.eventEmitter.on(Events.Stop, () => {
      const cancelFunctions = Object.values(this.cancelFunctions);
      for (let id = 0; id < cancelFunctions.length; id++) {
        const cancelFn = cancelFunctions[id];
        cancelFn();
        delete cancelFunctions[id];
      }
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

        await wait(5);
        this.storage.eventEmitter.emit(Events.NextIteration);
      }
    });
  }

  private async process(id: number) {
    // return new Promise<void>(async (resolve, reject) => {
    //   const cancelFn = () => {
    //     reject(new Error(`Task ${id} was cancelled`));
    //   };

    //   this.cancelFunctions[id] = cancelFn;

    //   delete this.cancelFunctions[id];
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

    const isFirst =
      this.tradeConfig.USDT_ADDRESS > this.tradeConfig.TOKEN_ADDRESS;

    const isSellingByRandom = txType.id != 0;
    // const buy = true;
    // const sell = false;
    // const isSellingByRandom = sell;
    const tradeDirection = isFirst ? isSellingByRandom : !isSellingByRandom;

    const usdAmount = this.randomService.general(min, max);

    const bankBalances = await this.getBankBalance();
    const bankUsdUnited = Number(
      ethers
        .formatUnits(bankBalances[0], this.tradeConfig.USDT_DECIMALS)
        .split('.')[0],
    );

    const bankTokenUnited = Number(
      ethers
        .formatUnits(bankBalances[1], this.tradeConfig.TOKEN_DECIMALS)
        .split('.')[0],
    );

    const bankTokenUnitedUSD = Number(
      ethers
        .formatUnits(bankBalances[2], this.tradeConfig.USDT_DECIMALS)
        .split('.')[0],
    );

    console.log(
      'bank balance:',
      bankUsdUnited + bankTokenUnitedUSD,
      bankUsdUnited,
      bankTokenUnitedUSD,
    );

    const tokenAmount = await this.usdToToken(usdAmount.toString());
    const tokenAmountUnited = Math.round(
      Number(ethers.formatUnits(tokenAmount, this.tradeConfig.TOKEN_DECIMALS)),
    );

    let tradeAmountUnited = isSellingByRandom ? usdAmount : tokenAmountUnited;

    const compareValue = isSellingByRandom ? bankUsdUnited : bankTokenUnited;

    const isPossible = tradeAmountUnited * 1.05 < compareValue;

    tradeAmountUnited = !isPossible
      ? !isSellingByRandom
        ? usdAmount
        : tokenAmountUnited
      : tradeAmountUnited;

    let message = `\n${this.storage.walletId}/${this.walletRange.endId}|${executer.address}\n`;
    const isSelling = isPossible ? tradeDirection : !tradeDirection; // Check balance to trade, else change direction
    if (!isPossible) {
      message += 'Direction was changed, cause balance of bank is low\n';
      // console.log(message);
      // return;
    }

    const decimalsIn = isSelling
      ? this.tradeConfig.USDT_DECIMALS
      : this.tradeConfig.TOKEN_DECIMALS;
    const decimalsOut = isSelling
      ? this.tradeConfig.TOKEN_DECIMALS
      : this.tradeConfig.USDT_DECIMALS;

    const methodName = isSelling ? 'sell' : 'buy';

    const tradeAmount = ethers.parseUnits(
      tradeAmountUnited.toString(),
      decimalsIn,
    );

    const dexService =
      this.tradeConfig.dex === Dex.Uniswap
        ? 'uniswapService'
        : 'pancakeService';

    const getExactAmount = isSelling
      ? this[dexService].getOutputAmountReversed(
          this.tradeConfig,
          Number(tradeAmount),
        )
      : this[dexService].getOutputAmount(this.tradeConfig, Number(tradeAmount));

    const exactAmount = await getExactAmount;

    let slippageAmount;
    const round = (n: number, roundBy = 10) => {
      let nBig = BigInt(n);
      let nStr = nBig.toString();
      if (nStr.length < roundBy + 1) {
        throw new Error('input is so low');
      }
      nStr = nStr.slice(0, nStr.length - roundBy);
      nStr = nStr.concat('0'.repeat(roundBy));
      return BigInt(nStr);
    };

    const roundBy = decimalsOut > 10 ? 10 : 2;

    if (this.tradeConfig.dex === Dex.Uniswap) {
      slippageAmount = isSelling
        ? round(exactAmount.quoteAmount, roundBy)
        : round(exactAmount.subAmount, roundBy);
    } else {
      slippageAmount = round(exactAmount.quoteAmount, roundBy);
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

    console.log(
      isSelling ? this.tradeConfig.sellMethod : this.tradeConfig.buyMethod,
      slippageAmount,
      tradeAmount,
    );

    const encodedData = isSelling
      ? botManager.interface.encodeFunctionData(
          `${this.tradeConfig.sellMethod}(uint256,uint256)`,
          [slippageAmount, tradeAmount],
        )
      : botManager.interface.encodeFunctionData(
          `${this.tradeConfig.buyMethod}(uint256,uint256)`,
          [tradeAmount, slippageAmount],
        );

    const nonce = await executer.getNonce();

    const feeData = await this.provider.getFeeData();
    // const gasPrice = BigInt(Math.round(Number(res.gasPrice) * 1.025));
    const { maxFeePerGas, maxPriorityFeePerGas } = feeData;

    const txBody: TransactionLike = {
      from: executer.address,
      to: this.tradeConfig.BOT_MANAGER,
      data: encodedData,
      value: 0,
      nonce,
      chainId: 42161,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    const tx = await executer.sendTransaction(txBody);
    const response = await tx.wait();
    this.logger.log(`response.hash: ${response.hash}`);
    message += `\n\n${this.tradeConfig.scanerUrl}${response.hash}`;
    //   console.log('Tx reveted', error);
    //   console.log(txBody);
    //   const { result } = error;
    //   console.log(result);
    // }

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
      awaitTime = this.randomService.general(randomMin, randomMax);
    }

    this.logger.log(
      `Next tx will run after ${(awaitTime / 60).toFixed(2)} minutes`,
    );
    await wait(awaitTime);
  }

  async usdToToken(usdInDecimal: string) {
    const usdAmount = Number(
      ethers.parseUnits(usdInDecimal, this.tradeConfig.USDT_DECIMALS),
    );

    const isFirst =
      this.tradeConfig.USDT_ADDRESS > this.tradeConfig.TOKEN_ADDRESS;

    const dexService =
      this.tradeConfig.dex === Dex.Uniswap
        ? 'uniswapService'
        : 'pancakeService';

    const promise = isFirst
      ? this[dexService].getOutputAmountReversed(this.tradeConfig, usdAmount)
      : this[dexService].getOutputAmount(this.tradeConfig, usdAmount);

    const { quoteAmount: inToken } = await promise;

    return BigInt(inToken);
  }

  async tokenToUSD(tokenBalance: number) {
    const isFirst =
      this.tradeConfig.USDT_ADDRESS > this.tradeConfig.TOKEN_ADDRESS;

    const dexService =
      this.tradeConfig.dex === Dex.Uniswap
        ? 'uniswapService'
        : 'pancakeService';

    const promise = isFirst
      ? this[dexService].getOutputAmount(this.tradeConfig, tokenBalance)
      : this[dexService].getOutputAmountReversed(
          this.tradeConfig,
          tokenBalance,
        );

    const { quoteAmount: inUsd } = await promise;

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

    const tokenInUSD = await this.tokenToUSD(Number(tokenBalance));

    return [usdtBalance, tokenBalance, tokenInUSD];
  }
}

/*
0x03ddb1bf0000000000000000000000000000000000000000000036c207840f5b2f8c000000000000000000000000000000000000000000000000000000000000ab737b88
0x03ddb1bf000000000000000000000000000000000000000000001ed6ac1dc1e4b01c00000000000000000000000000000000000000000000000000000000000062f61ff0
*/
