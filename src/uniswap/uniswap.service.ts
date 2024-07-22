import { Injectable } from '@nestjs/common';
import { Token } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
import { Contract, ethers } from 'ethers';
import { TRADE_CONFIG } from 'src/config/trade.config';
import { provider } from 'scripts/provider';
import { BotManager__factory, ERC20__factory } from 'typechain-types';
import { uniswapV3PoolInterface } from 'abi/uniswapv3.pool.interface';

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
