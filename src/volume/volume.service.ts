import { Injectable, Logger } from '@nestjs/common';
import { Contract, ethers, TransactionResponse } from 'ethers';
import { getWalletById } from 'scripts/addressFactory';
import { provider } from 'scripts/provider';
import { wait } from 'src/helpers/time';
import { RandomService } from 'src/random/random.service';
import {
  AmountTypes,
  minBalance,
  minTimeWaiting,
  transferAmount,
  TxTypes,
  walletRange,
} from './dto/volume.dto';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { TRADE_CONFIG } from 'src/config/trade.config';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { ERC20__factory } from 'typechain-types';

@Injectable()
export class VolumeService {
  logger: Logger = new Logger('Volume');

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
    return getWalletById(this.controlsService.walletId).connect(provider);
  }

  private async listen() {
    this.telegramService.notify('Farm is starting');
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
      `Next executer ${this.controlsService.walletId}/${walletRange.endId} is: ${executer.address}`,
    );

    await this.increaseBalance();

    await this.runTrade();

    await this.waitRandomTime();

    this.controlsService.incrementWalletId();
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

    const isSellingByRandom = txType.id != 0;

    const usdAmount = this.randomService.general(min, max);

    const bankBalances = await this.getBankBalance();
    const readableBalances = bankBalances.map((bigValue) =>
      Math.round(Number(ethers.formatEther(bigValue))),
    );
    const tokenAmount = await this.usdToToken(usdAmount.toString());
    let tradeAmount = isSellingByRandom
      ? usdAmount
      : Math.round(Number(ethers.formatEther(tokenAmount)));

    const compareValue = isSellingByRandom
      ? readableBalances[0]
      : readableBalances[1];

    const isPossible = tradeAmount * 1.2 < compareValue;

    tradeAmount = !isPossible
      ? !isSellingByRandom
        ? usdAmount
        : Math.round(Number(ethers.formatEther(tokenAmount)))
      : tradeAmount;

    const isSelling = isPossible ? isSellingByRandom : !isSellingByRandom; // Check balance to trade, else change direction
    if (!isPossible) {
      this.logger.log('Direction was changed, cause balance of bank is low');
    }

    const decimalsOut = isSelling
      ? TRADE_CONFIG.USDT_DECIMALS
      : TRADE_CONFIG.TOKEN_DECIMALS;
    const decimalsIn = isSelling
      ? TRADE_CONFIG.TOKEN_DECIMALS
      : TRADE_CONFIG.USDT_DECIMALS;

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
    const usdAmount = ethers.parseEther(usdInDecimal);
    const token0 = await this.uniswapService.pool.token0();
    const isFirst =
      token0.toLowerCase() === TRADE_CONFIG.TOKEN_ADDRESS.toLowerCase();

    const promise = isFirst
      ? this.uniswapService.getOutputAmount(usdAmount.toString())
      : this.uniswapService.getInputAmount(usdAmount.toString());

    const inToken = await promise;
    return BigInt(inToken);
  }

  async tokenToUSD(tokenBalance: number) {
    const token0 = await this.uniswapService.pool.token0();
    const isFirst =
      token0.toLowerCase() === TRADE_CONFIG.TOKEN_ADDRESS.toLowerCase();

    const promise = isFirst
      ? this.uniswapService.getInputAmount(tokenBalance.toString())
      : this.uniswapService.getOutputAmount(tokenBalance.toString());

    const inUsd = await promise;
    return BigInt(inUsd);
  }

  async getBankBalance() {
    const bankAddress = '0x7D89F5A712Fcc3968DbBAAF7a0c92e426e170C77';

    const usdtContract = new Contract(
      TRADE_CONFIG.USDT_ADDRESS,
      ERC20__factory.abi,
      provider,
    );
    const tokenContract = new Contract(
      TRADE_CONFIG.TOKEN_ADDRESS,
      ERC20__factory.abi,
      provider,
    );

    const usdtBalance = await usdtContract.balanceOf(bankAddress);
    const tokenBalance = await tokenContract.balanceOf(bankAddress);
    const tokenInUSD = await this.tokenToUSD(tokenBalance);

    return [usdtBalance, tokenBalance, tokenInUSD];
  }
}
