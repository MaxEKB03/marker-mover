import { Injectable } from '@nestjs/common';
import { RandomConfigure, RandomElement } from 'src/volume/dto/volume.dto';

@Injectable()
export class RandomService {
  general(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min);
  }

  ofList<T>(list: Array<T>): T {
    const id = this.general(0, list.length - 1);
    return list[id];
  }

  ofConfigured(config: RandomConfigure): RandomElement {
    const sumOfPercents = Object.values(config).map((d) => d.percent); // TODO: revert error is != 100
    const percent = this.general(0, 100);
    let currentPercent = 0;

    const elementName = Object.keys(config).find((name, id) => {
      currentPercent += config[name].percent;
      return percent <= currentPercent;
    });

    return config[elementName];
  }
}
