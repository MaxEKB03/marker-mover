import { Injectable } from '@nestjs/common';
import { uniswapV3PoolInterface } from 'abi/uniswapv3.pool.interface';
import {
  BaseContract,
  Contract,
  HDNodeWallet,
  Interface,
  InterfaceAbi,
  Provider,
} from 'ethers';
import { BotManagerV2__factory, ERC20__factory } from 'typechain-types';

@Injectable()
export class ContractsService {
  private createContract(
    target: string,
    abi: Interface | InterfaceAbi,
    provider: Provider,
    wallet?: HDNodeWallet,
  ): Contract {
    let contract = new Contract(target, abi, wallet ?? provider);
    return contract;
  }

  pool(
    poolAddress: string,
    provider: Provider,
    wallet?: HDNodeWallet,
  ): Contract {
    return this.createContract(
      poolAddress,
      uniswapV3PoolInterface,
      provider,
      wallet,
    );
  }

  botManager(
    botManagerAddress: string,
    provider: Provider,
    wallet?: HDNodeWallet,
  ): Contract {
    return this.createContract(
      botManagerAddress,
      BotManagerV2__factory.abi,
      provider,
      wallet,
    );
  }

  token(
    tokenAddress: string,
    provider: Provider,
    wallet?: HDNodeWallet,
  ): Contract {
    return this.createContract(
      tokenAddress,
      ERC20__factory.abi,
      provider,
      wallet,
    );
  }
}
