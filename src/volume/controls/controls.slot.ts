import { EventEmitter } from 'stream';
import { Events, WalletRange } from '../dto/volume.dto';

export class ControlsSlot {
  isRunning = false;
  walletId: number; // current executer by order
  eventEmitter = new EventEmitter();

  constructor(
    private readonly walletRange: WalletRange,
    public readonly managerId: number,
  ) {
    this.walletId = walletRange.startId;
  }

  run() {
    this.isRunning = true;
    this.eventEmitter.emit(Events.Start);
    this.eventEmitter.emit(Events.NextIteration);
  }

  stop() {
    this.isRunning = false;
    this.eventEmitter.emit(Events.Stop);
  }

  incrementWalletId(nextId?: number) {
    const { startId, endId } = this.walletRange;
    console.log(nextId);

    const addOne = nextId ?? this.walletId + 1;

    this.walletId = addOne < endId ? addOne : startId;
  }
}
