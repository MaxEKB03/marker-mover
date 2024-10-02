import { Injectable } from '@nestjs/common';
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Tick } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { provider } from 'scripts/provider';
import { ERC20__factory } from 'typechain-types';
import { uniswapV3PoolInterface } from 'abi/uniswapv3.pool.interface';
import * as JSBI from 'jsbi';
import { TradeConfig, TradeConfigV3 } from 'src/config/trade.config';
import { DexVersion } from 'src/volume/dto/volume.projects';

@Injectable()
export class UniswapService {
  BadRequest = new Error('UniswapV3: Wrong arguments, unsupported TradeConfig');

  constructor() {}

  // async smth1() {
  //   const formattedIn = '1';
  //   const amountIn = Number(ethers.parseEther(formattedIn));

  //   const price = await this.getOutputAmount(amountIn);

  //   const formattedOut = ethers.formatUnits(price.subAmount.toString(), 18);
  //   console.log(`price ${formattedOut}`);

  //   const amountOut = price.subAmount;

  //   // console.log(`${amountIn} > ${amountOut}`);
  //   console.log(`${formattedIn} > ${formattedOut}`);
  // }

  // async smth2() {
  //   const formattedOut = '1';
  //   const amountOut = Number(ethers.parseEther(formattedOut));

  //   const price = await this.getOutputAmountReversed(amountOut);

  //   const formattedIn = ethers.formatUnits(price.subAmount.toString(), 18);
  //   console.log(`price ${formattedIn}`);

  //   const amountIn = price.subAmount;

  //   // console.log(`${amountOut} > ${amountIn}`);
  //   console.log(`${formattedOut} > ${formattedIn}`);
  // }

  checkSupportV3(tradeConfig: TradeConfig): TradeConfigV3 {
    if (tradeConfig.dexVersion != DexVersion.V3) {
      throw this.BadRequest;
    }
    return tradeConfig;
  }

  async createToken(
    chainId: number,
    tokenAddress: string,
    decimals?: number,
  ): Promise<Token> {
    const erc20 = new ethers.Contract(tokenAddress, ERC20__factory.abi);
    decimals = decimals ? decimals : await erc20.decimals();

    return new Token(chainId, tokenAddress, decimals);
  }

  async createPool(
    tokenA: Token,
    tokenB: Token,
    poolAddress: string,
    feeAmount: FeeAmount,
  ) {
    const poolContract = new ethers.Contract(
      poolAddress,
      uniswapV3PoolInterface,
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

    const inputAmount = CurrencyAmount.fromRawAmount(
      isFirst ? tradeToken : usdToken,
      rawInputAmount,
    );

    const currencyAmount = await pool.getOutputAmount(inputAmount);
    const quoteAmount = Number(
      ethers.parseUnits(currencyAmount[0].toExact(), 18),
    );
    const portionAmount = quoteAmount * 0.0025;
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

    const inputAmount = CurrencyAmount.fromRawAmount(
      isFirst ? usdToken : tradeToken,
      rawInputAmount,
    );

    const currencyAmount = await pool.getOutputAmount(inputAmount);
    const quoteAmount = Number(
      ethers.parseUnits(currencyAmount[0].toExact(), 18),
    );
    const portionAmount = quoteAmount * 0.0025;
    const outputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: outputAmount };

    return res;
  }

  async getInputAmount(tradeConfig: TradeConfig, rawOutputAmount: number) {
    tradeConfig = this.checkSupportV3(tradeConfig);

    if (tradeConfig.dexVersion != DexVersion.V3) {
      throw this.BadRequest;
    }
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

    const outputAmount = CurrencyAmount.fromRawAmount(
      usdToken,
      rawOutputAmount,
    );

    const currencyAmount = await pool.getInputAmount(outputAmount);
    const quoteAmount = Number(
      ethers.parseUnits(currencyAmount[0].toExact(), 18),
    );
    const portionAmount = quoteAmount * 0.0025;
    const inputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: inputAmount };

    return res;
  }
}
