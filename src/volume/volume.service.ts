import { Injectable, Logger } from '@nestjs/common';
import { provider } from 'scripts/provider';
import { RandomService } from 'src/random/random.service';
import { UniswapService } from 'src/uniswap/uniswap.service';
import { ControlsService } from './controls/controls.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { VolumeBase } from './volume.base';
import { Dex, DexVersion, projects } from './dto/volume.projects';
import { VolumeV3 } from './volume.v3';

@Injectable()
export class VolumeService {
  logger: Logger = new Logger('Volume');
  slots: { [id: string]: VolumeBase } = {};

  constructor(
    private readonly randomService: RandomService,
    private readonly uniswapService: UniswapService,
    private readonly controlsService: ControlsService,
    protected readonly telegramService: TelegramService,
  ) {
    this.init();
  }

  init() {
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const { id, walletRange } = project;
      this.controlsService.createSlot(id, walletRange);
      if (project.dexVersion === DexVersion.V3) {
        this.slots[project.id] = new VolumeV3(
          id,
          walletRange,
          provider,
          this.randomService,
          this.uniswapService,
          this.controlsService,
          this.telegramService,
        );
      } else if (project.dexVersion === DexVersion.V2) {
        //       // TODO: add v2 support
      }
    }
  }
}
