import { Injectable } from '@nestjs/common';
import { Token } from '@uniswap/sdk-core';
import { Pool, Tick } from '@uniswap/v3-sdk';
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

  constructor() {}

  async smth() {
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

    const sqrtPriceX96: bigint = slot0[0];
    const price = Number(sqrtPriceX96) ** 2 / 2 ** 192;

    const amountOut = 1234;
    const amountOutWithFee =
      amountOut - (amountOut * TRADE_CONFIG.POOL_FEE) / 1000000;
    const amountIn = price * amountOutWithFee;
    const amountInWithSlippage = amountIn - (amountIn * 0.5) / 100;

    return amountInWithSlippage;
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

    const sqrtPriceX96: bigint = slot0[0];
    const price = Number(sqrtPriceX96) ** 2 / 2 ** 192;

    const amountOut = Number(rawOutputAmount);
    const amountOutWithFee =
      amountOut - (amountOut * TRADE_CONFIG.POOL_FEE) / 1000000;
    const amountIn = price * amountOutWithFee;
    const amountInWithSlippage = amountIn - (amountIn * 0.5) / 100;

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

    const sqrtPriceX96: bigint = slot0[0];
    const price = Number(sqrtPriceX96) ** 2 / 2 ** 192;

    const amountIn = Number(rawInputAmount);

    const amountInWithFee =
      amountIn - (amountIn * TRADE_CONFIG.POOL_FEE) / 1000000;
    const amountOut = amountInWithFee / price;
    const amountOuWithSlippage = amountOut - (amountOut * 0.5) / 100;

    return amountOuWithSlippage;
  }
}
