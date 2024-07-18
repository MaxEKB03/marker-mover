import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';

@Module({
  providers: [UniswapService]
})
export class UniswapModule {}
