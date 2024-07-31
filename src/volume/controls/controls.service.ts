import { Injectable } from '@nestjs/common';
import { walletRange } from '../dto/volume.dto';

@Injectable()
export class ControlsService {
  isRunning = false;
  walletId: number = walletRange.startId; // current executer by order

  incrementWalletId(nextId?: number) {
    const { startId, endId } = walletRange;
    console.log(nextId);

    const addOne = nextId ?? this.walletId + 1;

    this.walletId = addOne < endId ? addOne : startId;
  }
}
