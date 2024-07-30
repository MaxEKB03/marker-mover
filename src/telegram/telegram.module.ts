import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ControlsModule } from 'src/volume/controls/controls.module';

@Module({
  imports: [ControlsModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
