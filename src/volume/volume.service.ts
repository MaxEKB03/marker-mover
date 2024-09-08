import { Injectable, Logger } from '@nestjs/common';
import { provider } from 'scripts/provider';
import { RandomService } from 'src/random/random.service';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { VolumeBase } from './volume.base';
import { Dex, DexVersion, projects } from './dto/volume.projects';
import { VolumeV3 } from './volume.v3';
import { ContractsService } from 'src/contracts/contracts.service';
import { VolumeV2 } from './volume.v2';
import { UniswapServiceV2 } from 'src/uniswap/uniswap.serviceV2';
import { PancakeServiceV2 } from 'src/uniswap/pancake.serviceV2';

@Injectable()
export class VolumeService {
  logger: Logger = new Logger('Volume');
  slots: { [id: string]: VolumeBase } = {};

  constructor(
    private readonly randomService: RandomService,
    private readonly uniswapService: UniswapService,
    private readonly uniswapServiceV2: UniswapServiceV2,
    private readonly pancakeServiceV2: PancakeServiceV2,
    private readonly controlsService: ControlsService,
    private readonly contractsService: ContractsService,
    protected readonly telegramService: TelegramService,
  ) {
    this.init();
  }

  init() {
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const { id, managerId, walletRange, provider, tradeConfig } = project;
      this.controlsService.createSlot(id, walletRange, managerId);
      if (tradeConfig.dexVersion === DexVersion.V3) {
        this.slots[project.id] = new VolumeV3(
          id,
          this.controlsService,
          provider,
          this.telegramService,
          walletRange,
          tradeConfig,
          this.randomService,
          this.uniswapService,
          this.contractsService,
        );
      } else if (project.tradeConfig.dexVersion === DexVersion.V2) {
        this.slots[project.id] = new VolumeV2(
          id,
          this.controlsService,
          provider,
          this.telegramService,
          walletRange,
          tradeConfig,
          this.randomService,
          this.contractsService,
          this.uniswapServiceV2,
          this.pancakeServiceV2,
        );
      }
    }
  }
}
