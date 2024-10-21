import { EventEmitter } from 'stream';
import { Events, WalletRange } from '../dto/volume.dto';
import { RandomService } from 'src/random/random.service';

export class ControlsSlot {
  isRunning = false;
  walletId: number; // current executer by order
  eventEmitter = new EventEmitter();

  constructor(
    private readonly walletRange: WalletRange,
    public readonly managerId: number,
    private readonly randomService: RandomService,
  ) {
    this.walletId = walletRange.startId;
  }

  run() {
    this.isRunning = true;
    this.eventEmitter.emit(Events.Start);
  }

  stop() {
    this.isRunning = false;
    this.eventEmitter.emit(Events.Stop);
  }

  computeNextWalletId(nextId?: number) {
    this.walletId = this.randomService.general(
      this.walletRange.startId,
      this.walletRange.endId,
    );
  }
}
