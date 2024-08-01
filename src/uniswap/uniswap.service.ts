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
    // this.smth();
  }

  async smth() {
    const amountIn = Number(ethers.parseEther('1'));

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

    const poolContract = new ethers.Contract(
      TRADE_CONFIG.POOL_ADDRESS,
      uniswapV3PoolInterface,
      provider,
    );

    const slot0 = await poolContract.slot0();
    const liquidity = Number(await poolContract.liquidity());
    const Q96 = 79228162514264337593543950336;

    const sqrtPriceX96 = Number(slot0[0]);
    const tick = Number(slot0[1]);

    // PRICE 1
    const price1 = sqrtPriceX96 ** 2 / 2 ** 192;

    // PRICE 2
    const price2 = (1.0001 ** tick * 10 ** 18) / 10 ** 18;

    // PRICE 3
    const amount0 = Number(
      FullMath.mulDivRoundingUp(
        JSBI['BigInt'](liquidity),
        JSBI['BigInt'](Q96),
        JSBI['BigInt'](sqrtPriceX96),
      ).toString(),
    );

    const amount1 = Number(
      FullMath.mulDivRoundingUp(
        JSBI['BigInt'](liquidity),
        JSBI['BigInt'](sqrtPriceX96),
        JSBI['BigInt'](Q96),
      ).toString(),
    );

    const price3 = (amount1 * 10 ** 18) / amount0; // 18 is token0.decimals

    // PRICE 4
    const price4 = await this.getOutputAmount2(amountIn);

    console.log('price1', price1);
    console.log('price2', price2);
    console.log('price3', ethers.formatUnits(price3.toString(), 18));
    console.log('price4', price4, '\n');

    const amountOut1 = amountIn * price1;
    const amountOut2 = amountIn * price2;
    const amountOut3 = amountIn * price3;
    const amountOut4 = amountIn * price4.subAmount;

    console.log('amountOut1', amountOut1);
    console.log('amountOut2', amountOut2);
    console.log('amountOut3', amountOut3);
    console.log('amountOut4', amountOut4);

    // const amountOut = 1234;
    // const amountOutWithFee =
    //   amountOut - (amountOut * TRADE_CONFIG.POOL_FEE) / 1000000;
    // const amountIn = price1 * amountOutWithFee;
    // const amountInWithSlippage = amountIn - (amountIn * 0.4) / 100;

    // return amountInWithSlippage;
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

  /**
   *
   * @param rawOutputAmount token0 amount
   * @returns token1 amount with slippage 0.5
   */
  async getInputAmount(rawOutputAmount: string) {
    const poolContract = new ethers.Contract(
      TRADE_CONFIG.POOL_ADDRESS,
      uniswapV3PoolInterface,
      provider,
    );

    const slot0 = await poolContract.slot0();
    const liquidity = Number(await poolContract.liquidity());
    const Q96 = 79228162514264337593543950336;

    const sqrtPriceX96 = Number(slot0[0]);
    const price = Number(sqrtPriceX96) ** 2 / 2 ** 192 + 0.0003;
    console.log('price', price);

    const amount0 = Number(
      FullMath.mulDivRoundingUp(
        JSBI['BigInt'](liquidity),
        JSBI['BigInt'](Q96),
        JSBI['BigInt'](sqrtPriceX96),
      ).toString(),
    );

    const amount1 = Number(
      FullMath.mulDivRoundingUp(
        JSBI['BigInt'](liquidity),
        JSBI['BigInt'](sqrtPriceX96),
        JSBI['BigInt'](Q96),
      ).toString(),
    );
    const price2 = (amount1 * 10 ** 18) / amount0; // 18 is token0.decimals
    console.log('price2', ethers.formatUnits(price2.toString(), 18));

    const amountOut = Number(rawOutputAmount);
    const amountOutWithFee =
      amountOut - (amountOut * TRADE_CONFIG.POOL_FEE) / 1000000;
    const amountIn = amountOutWithFee * price;
    const amountInWithSlippage = amountIn - (amountIn * 0.4) / 100;

    console.log(amountIn, amountInWithSlippage);

    return amountInWithSlippage;
  }

  /**
   *
   * @param rawInputAmount token1 amount
   * @returns token0 amount with slippage 0.5
   */
  async getOutputAmount(rawInputAmount: string) {
    const poolContract = new ethers.Contract(
      TRADE_CONFIG.POOL_ADDRESS,
      uniswapV3PoolInterface,
      provider,
    );

    const slot0 = await poolContract.slot0();
    console.log(slot0[0]);

    const sqrtPriceX96: bigint = slot0[0];
    const price = 1 / (Number(sqrtPriceX96) ** 2 / 2 ** 192 + 0.0003);
    console.log('price', price);

    const amountIn = Number(rawInputAmount);

    const amountInWithFee =
      amountIn - (amountIn * TRADE_CONFIG.POOL_FEE) / 1000000;
    const amountOut = amountInWithFee * price;
    const amountOuWithSlippage = amountOut - (amountOut * 0.4) / 100;

    // console.log(amountOut, amountOuWithSlippage);

    return amountOuWithSlippage;
  }

  async getOutputAmount2(rawInputAmount: number) {
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

  async getInputAmount2(rawOutputAmount: number) {
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
