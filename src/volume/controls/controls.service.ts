import { Injectable } from '@nestjs/common';
import { WalletRange, walletRange } from '../dto/volume.dto';
import { ControlsSlot } from './controls.slot';
import { RandomService } from 'src/random/random.service';

@Injectable()
export class ControlsService {
  slots: { [id: string]: ControlsSlot } = {};

  createSlot(
    id: string,
    walletRange: WalletRange,
    managerId: number,
    randomService: RandomService,
  ) {
    this.slots[id] = new ControlsSlot(walletRange, managerId, randomService);
  }

  deleteSlot(id: string) {
    delete this.slots[id];
  }
}
