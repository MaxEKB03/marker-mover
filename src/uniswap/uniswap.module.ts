import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { MathService } from './math.service';
import { UniswapServiceV2 } from './uniswap.serviceV2';
import { PancakeServiceV2 } from './pancake.serviceV2';

@Module({
  exports: [UniswapService, UniswapServiceV2, PancakeServiceV2],
  providers: [UniswapService, UniswapServiceV2, PancakeServiceV2, MathService],
})
export class UniswapModule {}
