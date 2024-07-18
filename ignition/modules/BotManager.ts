import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import * as fs from 'fs';
import * as hre from 'hardhat';

export default buildModule('BotManager', (m) => {
  const chainID = hre.network.config.chainId;
  const deployments = JSON.parse(
    fs
      .readFileSync(
        `ignition/deployments/chain-${chainID}/deployed_addresses.json`,
      )
      .toLocaleString(),
  );

  return {};
});
