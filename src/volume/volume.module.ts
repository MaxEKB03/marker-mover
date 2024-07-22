import { Module } from '@nestjs/common';
import { VolumeController } from './volume.controller';
import { VolumeService } from './volume.service';
import { RandomModule } from 'src/random/random.module';
import { UniswapModule } from 'src/uniswap/uniswap.module';

@Module({
  imports: [RandomModule, UniswapModule],
  controllers: [VolumeController],
  providers: [VolumeService],
})
export class VolumeModule {}
