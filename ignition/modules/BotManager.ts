import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import * as fs from 'fs';
import * as hre from 'hardhat';
import { getWalletById } from '../../scripts/address-factory';

export default buildModule('BotManager', (m) => {
  // idk how ignition works, mb should run other txs from scripts/deploy.ts with hre.ignition

  ////////////////////////////////////////////////////////////////////
  // TODO: before deployment
  // - approve token0, token1 for pancake factoryV3
  // - addLiquidity (first add will deploy pool)
  // - repeat for uniswap
  ////////////////////////////////////////////////////////////////////

  const poolAddress = '0xF07CADe40aeA76A8e2Bf26065F499B93e13De928';
  const manager = getWalletById(1).address;

  const chainID = hre.network.config.chainId;
  const deployments = JSON.parse(
    fs
      .readFileSync(
        `ignition/deployments/chain-${chainID}/deployed_addresses.json`,
      )
      .toLocaleString(),
  );

  const botManager = m.contract('BotManager', [poolAddress, manager]);

  return { botManager };

  ////////////////////////////////////////////////////////////////////
  // TODO: after deployment
  // - bank approve token0, token1 for new contract
  // - add list of executers at new contract;
  ////////////////////////////////////////////////////////////////////
});
