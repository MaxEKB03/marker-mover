import { Injectable } from '@nestjs/common';
import { WalletRange, walletRange } from '../dto/volume.dto';
import { ControlsSlot } from './controls.slot';

@Injectable()
export class ControlsService {
  slots: { [id: string]: ControlsSlot } = {};

  createSlot(id: string, walletRange: WalletRange) {
    this.slots[id] = new ControlsSlot(walletRange);
  }

  deleteSlot(id: string) {
    delete this.slots[id];
  }
}
