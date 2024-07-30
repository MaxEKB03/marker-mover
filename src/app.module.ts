import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VolumeModule } from './volume/volume.module';
import { UniswapModule } from './uniswap/uniswap.module';
import { RandomModule } from './random/random.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [VolumeModule, UniswapModule, RandomModule, TelegramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
