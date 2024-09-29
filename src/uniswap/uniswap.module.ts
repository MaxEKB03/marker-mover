import { Module } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { UniswapServiceV2 } from './uniswap.serviceV2';
import { PancakeServiceV2 } from './pancake.serviceV2';
import { PancakeService } from './pancake.service';

@Module({
  exports: [UniswapService, PancakeService, UniswapServiceV2, PancakeServiceV2],
  providers: [
    UniswapService,
    PancakeService,
    UniswapServiceV2,
    PancakeServiceV2,
  ],
})
export class UniswapModule {}
