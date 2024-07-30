import { Module } from '@nestjs/common';
import { ControlsService } from './controls.service';

@Module({
  providers: [ControlsService],
  exports: [ControlsService],
})
export class ControlsModule {}
