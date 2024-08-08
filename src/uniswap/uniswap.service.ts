import { Injectable } from '@nestjs/common';
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { FullMath, Pool, Tick } from '@uniswap/v3-sdk';
import { Contract, ethers } from 'ethers';
import { TRADE_CONFIG } from 'src/config/trade.config';
import { provider } from 'scripts/provider';
import { BotManager__factory, ERC20__factory } from 'typechain-types';
import { uniswapV3PoolInterface } from 'abi/uniswapv3.pool.interface';
import * as JSBI from 'jsbi';

@Injectable()
export class UniswapService {
  token0: Contract = new Contract(
    TRADE_CONFIG.USDT_ADDRESS,
    ERC20__factory.abi,
    provider,
  );
  token1: Contract = new Contract(
    TRADE_CONFIG.TOKEN_ADDRESS,
    ERC20__factory.abi,
    provider,
  );
  pool: Contract = new Contract(
    TRADE_CONFIG.POOL_ADDRESS,
    uniswapV3PoolInterface,
    provider,
  );
  botManager: Contract = new Contract(
    TRADE_CONFIG.BOT_MANAGER,
    BotManager__factory.abi,
    provider,
  );

  constructor() {
    // this.smth1();
    // this.smth2();
  }

  async smth1() {
    const formattedIn = '1';
    const amountIn = Number(ethers.parseEther(formattedIn));

    const price = await this.getOutputAmount(amountIn);

    const formattedOut = ethers.formatUnits(price.subAmount.toString(), 18);
    console.log(`price ${formattedOut}`);

    const amountOut = price.subAmount;

    // console.log(`${amountIn} > ${amountOut}`);
    console.log(`${formattedIn} > ${formattedOut}`);
  }

  async smth2() {
    const formattedOut = '1';
    const amountOut = Number(ethers.parseEther(formattedOut));

    const price = await this.getOutputAmountReversed(amountOut);

    const formattedIn = ethers.formatUnits(price.subAmount.toString(), 18);
    console.log(`price ${formattedIn}`);

    const amountIn = price.subAmount;

    // console.log(`${amountOut} > ${amountIn}`);
    console.log(`${formattedOut} > ${formattedIn}`);
  }

  async createToken(tokenAddress: string, decimals?: number): Promise<Token> {
    const erc20 = new ethers.Contract(tokenAddress, ERC20__factory.abi);
    decimals = decimals ? decimals : await erc20.decimals();

    return new Token(TRADE_CONFIG.CHAIN_ID, tokenAddress, decimals);
  }

  async createPool(tokenA: Token, tokenB: Token, poolAddress: string) {
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
      TRADE_CONFIG.POOL_FEE,
      sqrtPriceX96,
      liquidity,
      tick,
      tickData,
    );

    return pool;
  }

  async getOutputAmount(rawInputAmount: number) {
    const usdToken = await this.createToken(
      TRADE_CONFIG.USDT_ADDRESS,
      TRADE_CONFIG.USDT_DECIMALS,
    );
    const tradeToken = await this.createToken(
      TRADE_CONFIG.TOKEN_ADDRESS,
      TRADE_CONFIG.TOKEN_DECIMALS,
    );

    const pool = await this.createPool(
      usdToken,
      tradeToken,
      TRADE_CONFIG.POOL_ADDRESS,
    );

    const inputAmount = CurrencyAmount.fromRawAmount(
      tradeToken,
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

  async getOutputAmountReversed(rawInputAmount: number) {
    const usdToken = await this.createToken(
      TRADE_CONFIG.USDT_ADDRESS,
      TRADE_CONFIG.USDT_DECIMALS,
    );
    const tradeToken = await this.createToken(
      TRADE_CONFIG.TOKEN_ADDRESS,
      TRADE_CONFIG.TOKEN_DECIMALS,
    );

    const pool = await this.createPool(
      usdToken,
      tradeToken,
      TRADE_CONFIG.POOL_ADDRESS,
    );

    const inputAmount = CurrencyAmount.fromRawAmount(usdToken, rawInputAmount);

    const currencyAmount = await pool.getOutputAmount(inputAmount);
    const quoteAmount = Number(
      ethers.parseUnits(currencyAmount[0].toExact(), 18),
    );
    const portionAmount = quoteAmount * 0.0025;
    const outputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: outputAmount };

    return res;
  }

  async getInputAmount(rawOutputAmount: number) {
    const usdToken = await this.createToken(
      TRADE_CONFIG.USDT_ADDRESS,
      TRADE_CONFIG.USDT_DECIMALS,
    );
    const tradeToken = await this.createToken(
      TRADE_CONFIG.TOKEN_ADDRESS,
      TRADE_CONFIG.TOKEN_DECIMALS,
    );

    const pool = await this.createPool(
      usdToken,
      tradeToken,
      TRADE_CONFIG.POOL_ADDRESS,
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
