import { Module } from '@nestjs/common';
import { VolumeController } from './volume.controller';
import { VolumeService } from './volume.service';
import { RandomModule } from 'src/random/random.module';
import { UniswapModule } from 'src/uniswap/uniswap.module';
import { ControlsModule } from './controls/controls.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { ContractsModule } from 'src/contracts/contracts.module';

@Module({
  imports: [
    RandomModule,
    UniswapModule,
    ControlsModule,
    ContractsModule,
    TelegramModule,
  ],
  controllers: [VolumeController],
  providers: [VolumeService],
})
export class VolumeModule {}
