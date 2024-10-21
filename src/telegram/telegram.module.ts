import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ControlsModule } from 'src/volume/controls/controls.module';
import { RandomModule } from 'src/random/random.module';

@Module({
  imports: [ControlsModule, RandomModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
