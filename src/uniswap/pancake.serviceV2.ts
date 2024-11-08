import { Injectable } from '@nestjs/common';
import { Contract, ethers } from 'ethers';
import { provider } from 'scripts/provider';
import { ERC20__factory } from 'typechain-types';
import { TradeConfig, TradeConfigV2 } from 'src/config/trade.config';
import { Pair, TokenAmount, Token } from '../../pancake-swap-sdk/src/';
import { uniswapV2PairInterface } from 'abi/uniswapv2.pair.interface';

@Injectable()
export class PancakeServiceV2 {
  BadRequest = new Error('UniswapV3: Wrong arguments, unsupported TradeConfig');

  constructor() {}

  async createToken(
    chainId: number,
    tokenAddress: string,
    decimals?: number,
  ): Promise<Token> {
    const erc20 = new ethers.Contract(tokenAddress, ERC20__factory.abi);
    decimals = decimals ? decimals : await erc20.decimals();

    return new Token(chainId, tokenAddress, decimals);
  }

  async createTokens(
    tradeConfig: TradeConfigV2,
  ): Promise<[Token, Token, Boolean]> {
    const pairContract = new Contract(
      tradeConfig.PAIR_ADDRESS,
      uniswapV2PairInterface,
      provider,
    );

    const token0Address = await pairContract.token0();

    const isFirst =
      tradeConfig.TOKEN_ADDRESS.toLocaleLowerCase() ===
      token0Address.toLocaleLowerCase();

    const token0 = new Token(
      tradeConfig.CHAIN_ID,
      isFirst ? tradeConfig.TOKEN_ADDRESS : tradeConfig.USDT_ADDRESS,
      isFirst ? tradeConfig.TOKEN_DECIMALS : tradeConfig.USDT_DECIMALS,
    );
    const token1 = new Token(
      tradeConfig.CHAIN_ID,
      !isFirst ? tradeConfig.TOKEN_ADDRESS : tradeConfig.USDT_ADDRESS,
      !isFirst ? tradeConfig.TOKEN_DECIMALS : tradeConfig.USDT_DECIMALS,
    );

    return [token0, token1, isFirst];
  }

  async createPair(token0: Token, token1: Token, pairAddress: string) {
    const pairContract = new Contract(
      pairAddress,
      uniswapV2PairInterface,
      provider,
    );

    const reserves = await pairContract.getReserves();

    const tokenAmount0 = new TokenAmount(token0, Number(reserves[0]));
    const tokenAmount1 = new TokenAmount(token1, Number(reserves[1]));

    const pair = new Pair(tokenAmount0, tokenAmount1);

    return pair;
  }

  async getOutputAmount(tradeConfig: TradeConfigV2, rawInputAmount: number) {
    // console.log('getOutputAmount');

    const [token0, token1, isFirst] = await this.createTokens(tradeConfig);
    const inputCurrencyAmount = new TokenAmount(
      isFirst ? token0 : token1,
      rawInputAmount,
    );

    const pair = await this.createPair(
      token0,
      token1,
      tradeConfig.PAIR_ADDRESS,
    );

    const [outputCurrencyAmount] = pair.getOutputAmount(inputCurrencyAmount);

    const quoteAmount = Number(
      ethers.parseUnits(
        outputCurrencyAmount.toExact(),
        outputCurrencyAmount.currency.decimals,
      ),
    );
    const portionAmount = Number((quoteAmount * 0.0025).toFixed(0));
    const outputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: outputAmount };
    // console.log(res);

    return res;
  }

  async getOutputAmountReversed(
    tradeConfig: TradeConfigV2,
    rawInputAmount: number,
  ) {
    // console.log('PANCAKE getOutputAmountReversed');

    // console.log(rawInputAmount);

    const [token0, token1, isFirst] = await this.createTokens(tradeConfig);
    const inputCurrencyAmount = new TokenAmount(
      !isFirst ? token0 : token1,
      rawInputAmount,
    );

    const pair = await this.createPair(
      token0,
      token1,
      tradeConfig.PAIR_ADDRESS,
    );

    const [outputCurrencyAmount] = pair.getOutputAmount(inputCurrencyAmount);

    const quoteAmount = Number(
      ethers.parseUnits(
        outputCurrencyAmount.toExact(),
        outputCurrencyAmount.currency.decimals,
      ),
    );
    const portionAmount = Number((quoteAmount * 0.0025).toFixed(0));
    const outputAmount = quoteAmount - portionAmount;

    const res = { quoteAmount, portionAmount, subAmount: outputAmount };
    // console.log(res);

    return res;
  }
}
