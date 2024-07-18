import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VolumeModule } from './volume/volume.module';
import { UniswapModule } from './uniswap/uniswap.module';

@Module({
  imports: [VolumeModule, UniswapModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
