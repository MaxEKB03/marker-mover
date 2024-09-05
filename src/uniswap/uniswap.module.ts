import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { MathService } from './math.service';
import { UniswapServiceV2 } from './uniswap.serviceV2';

@Module({
  exports: [UniswapService, UniswapServiceV2],
  providers: [UniswapService, UniswapServiceV2, MathService],
})
export class UniswapModule {}
