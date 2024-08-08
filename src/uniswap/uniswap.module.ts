import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { MathService } from './math.service';

@Module({
  exports: [UniswapService],
  providers: [UniswapService, MathService],
})
export class UniswapModule {}
