import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';

@Module({
  exports: [UniswapService],
  providers: [UniswapService],
})
export class UniswapModule {}
