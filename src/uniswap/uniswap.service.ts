import { Injectable } from '@nestjs/common';
import { Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { erc20Interface } from 'abi/erc20.interface';
import { uniswapV3PoolInterface } from 'abi/uniswapv3.pool.interface';
import { TRADE_CONFIG } from 'src/config/trade.config';
import { provider } from 'scripts/provider';

@Injectable()
export class UniswapService {
  constructor() {
    this.computeQuote();
  }
  async createToken(tokenAddress: string, decimals?: number): Promise<Token> {
    const erc20 = new ethers.Contract(tokenAddress, erc20Interface);
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

    const pool = new Pool(
      tokenA,
      tokenB,
      TRADE_CONFIG.POOL_FEE,
      sqrtPriceX96,
      liquidity,
      tick,
    );

    const price = pool.priceOf(tokenB);
    const parsedInLiq = price.toFixed(tokenA.decimals);
    console.log(parsedInLiq);

    return pool;
  }

  async computeQuote() {
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
  }
}
