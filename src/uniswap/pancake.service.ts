import { Injectable } from '@nestjs/common';
import { CurrencyAmount, Token } from '@pancakeswap/swap-sdk-core';
import { FeeAmount, Pool, Tick, pancakeV3PoolABI } from '@pancakeswap/v3-sdk';
import { ethers } from 'ethers';
import { provider } from 'scripts/provider';
import { ERC20__factory } from 'typechain-types';
import * as JSBI from 'jsbi';
import { TradeConfig, TradeConfigV3 } from 'src/config/trade.config';
import { DexVersion } from 'src/volume/dto/volume.projects';

@Injectable()
export class PancakeService {
  BadRequest = new Error('PancakeV3: Wrong arguments, unsupported TradeConfig');

  constructor() {}

  checkSupportV3(tradeConfig: TradeConfig): TradeConfigV3 {
    if (tradeConfig.dexVersion != DexVersion.V3) {
      throw this.BadRequest;
    }
    return tradeConfig;
  }

  async createToken(
    chainId: number,
    tokenAddress: `0x${string}`,
    decimals?: number,
  ): Promise<Token> {
    const erc20 = new ethers.Contract(tokenAddress, ERC20__factory.abi);
    decimals = decimals ? decimals : await erc20.decimals();

    return new Token(chainId, tokenAddress, decimals, '');
  }

  async createPool(
    tokenA: Token,
    tokenB: Token,
    poolAddress: string,
    feeAmount: FeeAmount,
  ) {
    const poolContract = new ethers.Contract(
      poolAddress,
      pancakeV3PoolABI,
      provider,
    );

    const slot0 = await poolContract.slot0();
    const liqRes = await poolContract.liquidity();
    const liquidity = liqRes.toString();
    const sqrtPriceX96 = slot0[0].toString();
    const tick = Number(slot0[1]);

    const tickData: Tick[] = [
      {
        index: -1200,
        liquidityNet: JSBI['BigInt']('500000000000000000'),
        liquidityGross: JSBI['BigInt']('500000000000000000'),
      },
      {
        index: 0,
        liquidityNet: JSBI['BigInt']('0'),
        liquidityGross: JSBI['BigInt']('1000000000000000000'),
      },
      {
        index: 1200,
        liquidityNet: JSBI['BigInt']('-500000000000000000'),
        liquidityGross: JSBI['BigInt']('500000000000000000'),
      },
    ];

    const pool = new Pool(
      tokenA,
      tokenB,
      feeAmount,
      sqrtPriceX96,
      liquidity,
      tick,
      tickData,
    );

    return pool;
  }

  async getOutputAmount(tradeConfig: TradeConfig, rawInputAmount: number) {
    tradeConfig = this.checkSupportV3(tradeConfig);

    const isFirst = tradeConfig.USDT_ADDRESS > tradeConfig.TOKEN_ADDRESS;

    const usdToken = await this.createToken(
      tradeConfig.CHAIN_ID,
      tradeConfig.USDT_ADDRESS,
      tradeConfig.USDT_DECIMALS,
    );
    const tradeToken = await this.createToken(
      tradeConfig.CHAIN_ID,
      tradeConfig.TOKEN_ADDRESS,
      tradeConfig.TOKEN_DECIMALS,
    );

    const pool = await this.createPool(
      usdToken,
      tradeToken,
      tradeConfig.POOL_ADDRESS,
      tradeConfig.POOL_FEE,
    );

    const inputCurrncyAmount = CurrencyAmount.fromRawAmount(
      isFirst ? tradeToken : usdToken,
      rawInputAmount,
    );

    const [outputCurrencyAmount] =
      await pool.getOutputAmount(inputCurrncyAmount);
    const quoteAmount = Number(
      ethers.parseUnits(
        outputCurrencyAmount.toExact(),
        outputCurrencyAmount.currency.decimals,
      ),
    );
    const portionAmount = Number((quoteAmount * 0.0025).toFixed(0));
    const outputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: outputAmount };

    return res;
  }

  async getOutputAmountReversed(
    tradeConfig: TradeConfig,
    rawInputAmount: number,
  ) {
    tradeConfig = this.checkSupportV3(tradeConfig);

    const isFirst = tradeConfig.USDT_ADDRESS > tradeConfig.TOKEN_ADDRESS;

    const usdToken = await this.createToken(
      tradeConfig.CHAIN_ID,
      tradeConfig.USDT_ADDRESS,
      tradeConfig.USDT_DECIMALS,
    );
    const tradeToken = await this.createToken(
      tradeConfig.CHAIN_ID,
      tradeConfig.TOKEN_ADDRESS,
      tradeConfig.TOKEN_DECIMALS,
    );

    const pool = await this.createPool(
      usdToken,
      tradeToken,
      tradeConfig.POOL_ADDRESS,
      tradeConfig.POOL_FEE,
    );

    const inputCurrencyAmount = CurrencyAmount.fromRawAmount(
      isFirst ? usdToken : tradeToken,
      rawInputAmount,
    );

    const [outputCurrencyAmount] =
      await pool.getOutputAmount(inputCurrencyAmount);
    const quoteAmount = Number(
      ethers.parseUnits(
        outputCurrencyAmount.toExact(),
        outputCurrencyAmount.currency.decimals,
      ),
    );
    const portionAmount = Number((quoteAmount * 0.0025).toFixed(0));
    const outputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: outputAmount };

    return res;
  }
}
