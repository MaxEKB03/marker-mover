import * as fs from 'fs';
import { IS_MAINNET } from '../src/config/trade.config';

export function getDeployed() {
  const chainID = IS_MAINNET ? 56 : 97;
  const data = fs
    .readFileSync(
      `./ignition/deployments/chain-${chainID}/deployed_addresses.json`,
    )
    .toLocaleString();

  const encoded = JSON.parse(data);
  return encoded;
}
