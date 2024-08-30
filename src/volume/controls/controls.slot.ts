import { WalletRange } from '../dto/volume.dto';

export class ControlsSlot {
  isRunning = false;
  walletId: number; // current executer by order

  constructor(private readonly walletRange: WalletRange) {
    this.walletId = walletRange.startId;
  }
  incrementWalletId(nextId?: number) {
    const { startId, endId } = this.walletRange;
    console.log(nextId);

    const addOne = nextId ?? this.walletId + 1;

    this.walletId = addOne < endId ? addOne : startId;
  }
}
